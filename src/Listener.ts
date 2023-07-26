/* eslint-disable @typescript-eslint/no-this-alias */
import { ConstantString } from "./Constant";
import {
  EventInfoPlugin,
  EventName,
  EventStatus,
  EventStep,
  EventTreeAble,
  ResultShowPlugin,
} from "./type";

export class EventTree implements EventTreeAble {
  activeTime: Date;
  paths: EventTarget[];
  type: EventName;
  source: Event;
  plugins: EventInfoPlugin[] = [];
  resulePlugin: ResultShowPlugin[] = [];
  execStatus = new Map<EventStatus, EventStep[]>();

  static TreeMap = new Map<EventName, EventTree>();

  constructor(type: EventName) {
    this.type = type;
    this.handle = this.handle.bind(this);
    this.listener.bind(this)(type, true);
    if (EventTree.TreeMap.has(type)) {
      throw new Error(`${type} 已经被定义，无需再次监听`);
    }
    EventTree.TreeMap.set(type, this);
  }

  getEventStopStep() {
    const capture = this.execStatus.get(EventStatus.capture) || [];
    const target = this.execStatus.get(EventStatus.target) || [];
    const bubbling = this.execStatus.get(EventStatus.bubbling) || [];
    const table: [{ step: EventStep; infos: string[] } | null][] = [];
    const lastStep: EventStep = [...capture, ...target, ...bubbling]
      .filter(($1) => !!$1)
      .pop() as EventStep;
    return lastStep;
  }

  addPlugins(plugins: EventInfoPlugin[] = []) {
    const pluginMap = new Map();
    this.plugins.forEach(($1) => pluginMap.set($1.pluginName, $1));
    plugins.forEach(($1) => pluginMap.set($1.pluginName, $1));
    this.plugins = [...pluginMap.values()];
  }

  addLogPlugins(plugins: ResultShowPlugin[]) {
    const pluginMap = new Map();
    this.resulePlugin.forEach(($1) => pluginMap.set($1.pluginName, $1));
    plugins.forEach(($1) => pluginMap.set($1.pluginName, $1));
    this.resulePlugin = [...pluginMap.values()];
  }

  handle(event: Event) {
    if (event.eventPhase === Event.NONE) return;
    const status =
      event.eventPhase === Event.CAPTURING_PHASE
        ? EventStatus.capture
        : event.eventPhase === Event.AT_TARGET
        ? EventStatus.target
        : EventStatus.bubbling;
    const statusInfo = this.execStatus.get(status) || [];
    this.execStatus.set(status, statusInfo);
    const step = {} as EventStep;
    step.date = new Date();
    step.status = status;
    step.target = event.currentTarget as any;
    step.type = this.type;
    step.event = event;
    /***
     * react 旧版本 合成事件绑定在document
     * 执行合成事件时 原生事件流程已执行完毕
     * 
     * 
     * 受react新版本 合成事件影响 合成事件绑定在App 根组件上
     * 用于在合成事件中中断后 会导致原生事件也中断。
     */
    step.isStop =
      event.defaultPrevented === true ||
      (event.currentTarget === document && status === EventStatus.bubbling);
    const stepRes = this.plugins
      .filter(($1) => $1.isVisiable)
      .reduce(($1, $2) => $2.handle($1), step);
    statusInfo.push(stepRes);
    if (
      (event.currentTarget === window.document &&
        status === EventStatus.bubbling) ||
      event.defaultPrevented === true
    ) {
      ConstantString.LogStart && console.log(ConstantString.LogStart);
      this.plugins.forEach(($1) =>
        $1.eventCeaseLog(this, this.getEventStopStep())
      );
      (this.resulePlugin || []).forEach(($1) => $1.show(this));
      this.plugins
        .filter(($1) => $1.isVisiable)
        .forEach(($1) => {
          this.execStatus.forEach((vs) => {
            vs.forEach(($2) => $1.clearStep($2));
          });
          $1.clearPlugin();
        });
      this.execStatus.clear();
      this.clear();
      ConstantString.LogEnd && console.log(ConstantString.LogEnd);
    }
  }

  listener(type: EventName, capture = false) {
    const that = this;
    const handle = this.handle;
    window.addEventListener(
      type,
      (event: Event) => {
        that.source = event;
        const _stopImmediatePropagation = event.stopImmediatePropagation;
        event.stopImmediatePropagation = function () {
          _stopImmediatePropagation.bind(event)();
          that.handle(event);
        };
        that.activeTime = new Date();
        const paths = event.composedPath();
        that.paths = paths;
        that.paths.forEach(($1) => {
          if ($1 === window) return;
          $1.removeEventListener(type, handle, true);
          $1.removeEventListener(type, handle, false);
          $1.addEventListener(type, handle, {
            capture: true,
            isListener: true,
          } as any);
          $1.addEventListener(type, handle, {
            capture: false,
            isListener: true,
          } as any);
        });
        this.plugins
          .filter(($1) => $1.isVisiable)
          .forEach(($1) => $1.onWindowDispatch(type, event));
      },
      capture
    );
  }

  clear() {
    (this.paths || []).forEach(($1) => {
      $1.removeEventListener(this.type, this.handle, true);
      $1.removeEventListener(this.type, this.handle, false);
    });
    this.paths = [];
  }
}
