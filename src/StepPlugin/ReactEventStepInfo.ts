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

type Log = (tree: EventTree, lastStep: ReactEventStep) => void;

// const reactPropsKeys = ["__reactEventHandlers$", "__reactProps$"];
// const reactInstanceKeys = ["__reactInternalInstance$", "__reactFiber$"];
// const getReactKey = () => {
//   const tags = ["div", "img", "a", "span", "p"];
//   for (let jndex = 0; jndex < tags.length; jndex++) {
//     const targets = document.getElementsByTagName(tags[jndex]);
//     for (let index = 0; index < targets.length; index++) {
//       const item = targets[index];
//       const eventKey = Object.keys(item).find(($1) =>
//         reactPropsKeys.some(($2) => $1.startsWith($2))
//       );
//       const instanceKey = Object.keys(item).find(($1) =>
//         reactInstanceKeys.some(($2) => $1.startsWith($2))
//       );
//       if (eventKey && instanceKey) {
//         return [eventKey, instanceKey];
//       }
//     }
//   }

//   return ["", ""];
// };

const isRootElement = (target: any) => {
  const { stateNode } = target;
  return stateNode.constructor.name === "FiberRootNode";
};
const getReactKey = () => {
  let eventKey = "";
  let instanceKey = "";
  let randomId = "";
  const startTag = "__react";
  const tags = ["div", "span", "img"];
  for (let index = 0; index < tags.length; index++) {
    const eles = document.getElementsByTagName(tags[index]);
    for (let jndex = 0; jndex < eles.length; jndex++) {
      if (eventKey && instanceKey && randomId) return [eventKey, instanceKey];
      const ele = eles[jndex];
      const keys = Object.keys(ele);
      for (let kndex = 0; kndex < keys.length; kndex++) {
        const $1 = keys[kndex];
        if (
          $1.startsWith(startTag) &&
          ((randomId && $1.endsWith(randomId)) || randomId === "")
        ) {
          const value = Reflect.get(ele, $1);
          if (
            !(
              value &&
              value.constructor.name === "FiberNode" &&
              isRootElement(value)
            )
          ) {
            if (value && value.constructor.name === "FiberNode") {
              instanceKey = $1;
              randomId = $1.split("$")[1];
            } else if (randomId && $1.endsWith(randomId)) {
              eventKey = $1;
            }
          }
        }
        if (eventKey && instanceKey && randomId) return [eventKey, instanceKey];
      }
    }
  }
  return ["", ""];
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

const isCaptureEvent = (name: string) =>
  name.startsWith("on") && name.endsWith("Capture");

const getEventStatus = (name: string, event: SyntheticEvent) => {
  if (isCaptureEvent(name)) return EventStatus.capture;
  if (event.currentTarget === event.target) return EventStatus.target;
  return EventStatus.bubbling;
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
      const [eventKey, instanceKey] = getReactKey();
      ReactEventStepInfo.ReactEventHandleName = eventKey;
      ReactEventStepInfo.ReactInstanceName = instanceKey;
      ReactEventStepInfo.ReactEventHandleNameOld = `${ReactEventStepInfo.ReactEventHandleName}_Source`;
      this.isReact = !!ReactEventStepInfo.ReactEventHandleName;
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
          console.log(`%c${ConstantString.ReactEventNoStop}终止于：`, "color:red",[lastStep]);
      }
    }.bind(this, tree, lastStep);
  }
}
