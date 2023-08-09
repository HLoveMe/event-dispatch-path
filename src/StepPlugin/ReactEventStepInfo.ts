import { SyntheticEvent } from "react";
import {
  EventInfoPlugin,
  EventName,
  EventStatus,
  EventStep,
  ReactEventStep,
} from "../type";
import { EventTree } from "../Listener";
import { ConstantString } from "../Constant";
import { getReactInfoKey, isReact, isRootElement } from "../EventUtil";

type Log = (tree: EventTree, lastStep: ReactEventStep) => void;

const isCaptureEvent = (name: string) =>
  name.startsWith("on") && name.endsWith("Capture");

const getEventStatus = (name: string, event: SyntheticEvent) => {
  if (isCaptureEvent(name)) return EventStatus.capture;
  if (event.currentTarget === event.target) return EventStatus.target;
  return EventStatus.bubbling;
};

const getRootTarget = (paths: EventTarget[]) => {
  const startTag = "__react";
  for (let index = 0; index < paths.length; index++) {
    const element = paths[index];
    const keys = Object.keys(element);
    for (let kndex = 0; kndex < keys.length; kndex++) {
      const key = keys[kndex];
      const item = Reflect.get(element, key);
      if (
        key.startsWith(startTag) &&
        item?.constructor.name === "FiberNode" &&
        isRootElement(item)
      ) {
        return [key, element, item];
      }
    }
  }
  return [null, null, null];
};

export class ReactEventStepInfo implements EventInfoPlugin {
  static ReactEventHandleName = "";

  static ReactInstanceName = "";

  static ReactEventHandleNameOld = "";

  pluginName = "ReactEventStep";

  isVisiable = true;

  isReact = false;

  paths: EventTarget[];

  execStatus = new Map<string, EventStep[]>();

  log?: Log;

  onWindowDispatch(type: EventName, event: Event) {
    if (ReactEventStepInfo.ReactEventHandleName.length === 0) {
      const [eventKey, instanceKey] = getReactInfoKey();
      ReactEventStepInfo.ReactEventHandleName = eventKey;
      ReactEventStepInfo.ReactInstanceName = instanceKey;
      ReactEventStepInfo.ReactEventHandleNameOld = `${ReactEventStepInfo.ReactEventHandleName}_Source`;
      this.isReact = isReact();
      this.isVisiable = this.isReact;
    }
    if (this.isReact && this.isVisiable) {
      const paths = event.composedPath();
      this.paths = paths;
      const that = this;
      paths.forEach(($1) => {
        if ($1 === window) return;
        const handler = $1[ReactEventStepInfo.ReactEventHandleName];
        if (handler) {
          $1[ReactEventStepInfo.ReactEventHandleNameOld] = handler;
          $1[ReactEventStepInfo.ReactEventHandleName] = new Proxy(
            {},
            {
              get(_, p: string) {
                const res = handler[p];
                if (typeof res === "function") {
                  return function (...args: any[]) {
                    (res as Function).apply(this, args);
                    const sEvent = args[0] as SyntheticEvent;
                    const status = getEventStatus(p, sEvent);
                    const arr = that.execStatus.get(status) || [];
                    that.execStatus.set(status, arr);
                    const step = {
                      type: sEvent.type,
                      date: new Date(),
                      isStop: sEvent.defaultPrevented,
                      target: sEvent.currentTarget,
                      status,
                      event: sEvent as any,
                      react: {
                        component:
                          sEvent.currentTarget[
                            ReactEventStepInfo.ReactInstanceName
                          ]?._debugOwner?.elementType,
                        file: sEvent.currentTarget[
                          ReactEventStepInfo.ReactInstanceName
                        ]?._debugSource?.fileName,
                        function: res,
                        isStop: sEvent.defaultPrevented,
                      },
                    };
                    arr.push(step as ReactEventStep);
                  };
                }
                return res;
              },
            }
          );
        }
      });
    }
  }

  handle(step: EventStep) {
    return step;
  }

  getDescribe() {
    if (this.isReact) {
      return "react:(2-1) react 原生事件流";
    }
    return "";
  }

  clearStep(stepInfo: EventStep) {}

  clearPlugin() {
    this.paths.forEach(($1) => {
      const source = $1[ReactEventStepInfo.ReactEventHandleNameOld];
      if (source) {
        $1[ReactEventStepInfo.ReactEventHandleName] = source;
        delete $1[ReactEventStepInfo.ReactEventHandleNameOld];
      }
    });
    this.paths = [];
    this.execStatus.clear();
    this.log && this.log.call(null);
    this.log = null;
  }

  eventCeaseLog(tree: EventTree) {
    if (!this.isReact) return;
    const [key, root] = getRootTarget(this.paths);
    if (!key || !root) return;
    // const table = [];
    let isStop = false;
    let lastStep: ReactEventStep | HTMLElement = root;
    [EventStatus.capture, EventStatus.target, EventStatus.bubbling].forEach(
      ($1) => {
        const steps = tree.execStatus.get($1);
        const r_steps = this.execStatus.get($1) || [];
        // const row: any[] = [];
        steps.forEach(($2: any) => {
          const r_step = r_steps.find(
            ($3) => $3.target === $2.target
          ) as ReactEventStep;
          // const info = {};
          // r_step
          //   ? Object.assign(info, r_step)
          //   : Object.assign(info, {} /**$2*/);
          // row.push(info);
          if (r_step) {
            Object.assign($2, { react: Object.assign({}, r_step.react) });
            isStop === false && (isStop = r_step.isStop);
            isStop && (lastStep = r_step);
          }
        });
        // table.push(row);
      }
    );
    this.log = function (tree: EventTree, lastStep: ReactEventStep) {
      if (isStop) {
        // const
        ConstantString.ReactEventStop &&
          console.log(
            `%c${ConstantString.ReactEventStop}
            文件路径：${lastStep.react.file}
            组件：【${lastStep.react.component.name}】
            在该方法中中断：`,
            "color:red",
            [lastStep.react.function]
          );
      } else {
        ConstantString.ReactEventNoStop &&
          console.log(
            `%c${ConstantString.ReactEventNoStop}终止于：`,
            "color:red",
            [lastStep]
          );
      }
    }.bind(this, tree, lastStep);
  }
}
