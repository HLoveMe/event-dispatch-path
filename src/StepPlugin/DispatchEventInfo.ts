import {
  EventInfoPlugin,
  EventName,
  EventStatus,
  EventStep,
  EventTreeAble,
} from "../type";
type BindInfo = {
  listener: Function;
  once: boolean;
  passive: boolean;
  type: string;
  useCapture: boolean;
};
interface EventListenersElement extends Node {
  getEventListeners(type: string): BindInfo[];
  _weakMap: WeakMap<Function, Function>;
  execCallBack: { [K in EventName]?: (event: Event, source: Function) => void };
}

(function () {
  "use strict";
  if (
    (Node.prototype as any)._addEventListener ||
    (Node.prototype as any)._removeEventListener
  )
    return;
  (Node.prototype as any)._addEventListener = (
    Node.prototype as any
  ).addEventListener;
  (Node.prototype as any)._removeEventListener = (
    Node.prototype as any
  ).removeEventListener;
  (Node.prototype as any).addEventListener = function (
    type: string,
    listener: Function,
    options: boolean | { capture: boolean; isListener: boolean }
  ) {
    if (!(this as EventListenersElement)._weakMap)
      (this as EventListenersElement)._weakMap = new WeakMap();
    if (!(this as EventListenersElement).execCallBack)
      (this as EventListenersElement).execCallBack = {};
    const eventMap = (this as EventListenersElement)._weakMap;
    const sourceListner = listener;
    if (typeof options === "object" && options.isListener) {
      // eventMap.set(listener, listener);
    } else {
      const _listener = function (this: any, ...args: any[]) {
        const res = sourceListner(...args);
        typeof this.execCallBack[type] === "function" &&
          this.execCallBack[type](...args, sourceListner);
        return res;
      }.bind(this);
      eventMap.set(listener, _listener);
      listener = _listener;
    }

    let useCapture = typeof options === "boolean" ? options : options?.capture;
    if (useCapture === undefined) {
      useCapture = false;
    }
    this._addEventListener(type, listener, useCapture);
    if (!this.eventListenerList) this.eventListenerList = {};
    if (!this.eventListenerList[type]) this.eventListenerList[type] = [];
    this.eventListenerList[type].push({
      type,
      listener,
      useCapture,
    });
  };
  (Node.prototype as any).removeEventListener = function (
    type: string,
    listener: Function,
    useCapture: any
  ) {
    if (!(this as EventListenersElement)._weakMap)
      (this as EventListenersElement)._weakMap = new WeakMap();
    const eventMap = (this as EventListenersElement)._weakMap;
    listener = eventMap.get(listener) || listener;
    eventMap.delete(listener);

    if (useCapture === undefined) {
      useCapture = false;
    }
    this._removeEventListener(type, listener, useCapture);
    if (!this.eventListenerList) this.eventListenerList = {};
    if (!this.eventListenerList[type]) this.eventListenerList[type] = [];
    for (let i = 0; i < this.eventListenerList[type].length; i++) {
      if (
        this.eventListenerList[type][i].listener === listener &&
        this.eventListenerList[type][i].useCapture === useCapture
      ) {
        this.eventListenerList[type].splice(i, 1);
        break;
      }
    }
    if (this.eventListenerList[type].length === 0)
      delete this.eventListenerList[type];
  };
  (Node.prototype as any).getEventListeners = function (type: string) {
    if (!this.eventListenerList) (this as any).eventListenerList = {};
    if (type === undefined) return (this as any).eventListenerList;
    return (this as any).eventListenerList[type] || [];
  };
})();
const isSupport = (target: EventTarget) =>
  !!(target as unknown as EventListenersElement).getEventListeners;

export class DispatchEventInfo implements EventInfoPlugin {
  lastExecInfo?: { source: Function; event: Event } = undefined;

  pluginName = "ChromeEventInfoPlugin";

  currentPaths: EventTarget[];

  type: EventName;

  isVisiable = true;

  constructor() {
    console.warn("想要使用该插件功能,请在项目置顶加载");
  }

  onWindowDispatch(type: EventName, event: Event): void {
    const paths = event.composedPath();
    paths.forEach(($1) => this._bindCallBack(type, $1));
    this.currentPaths = paths;
    this.type = type;
  }

  handle(stepInfo: EventStep): EventStep {
    // if (this.lastExecInfo && this.lastExecInfo.event.cancelBubble === true) {
    //   debugger;
    // }
    return stepInfo;
  }

  getDescribe(stepInfo: EventStep): string {
    return "";
  }

  _bindCallBack(type: keyof WindowEventMap, _target: EventTarget) {
    if (isSupport(_target) === false) return;
    const target = _target as EventListenersElement;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    !target.execCallBack[type] &&
      (target.execCallBack[type] = function (event: Event, source: Function) {
        if (event.cancelBubble === true) {
          that.lastExecInfo = { source, event };
        }
      });
  }

  clearStep(stepInfo: EventStep) {}

  clearPlugin(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    that.currentPaths.forEach((_target) => {
      const target = _target as EventListenersElement;
      target.execCallBack && delete target.execCallBack[that.type];
    });
    this.currentPaths = [];
    this.lastExecInfo = undefined;
  }

  eventCeaseLog(step: EventStep, tree: EventTreeAble) {
    if (step && this.lastExecInfo?.source) {
      console.log(
        `${this.pluginName}：%c该事件,事件流被取消于:`,
        "color: red",
        [this.lastExecInfo.source]
      );
    }
  }
}
