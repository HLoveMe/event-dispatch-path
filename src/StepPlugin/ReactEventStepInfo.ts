import { SyntheticEvent } from "react";
import { EventInfoPlugin, EventName, EventStatus, EventStep } from "../type";
import { EventTree } from "../Listener";

interface ReactEventStep extends EventStep {
  component?: any;
}

const getReactKey = () => {
  const targets = document.querySelectorAll("*[id]");
  for (let index = 0; index < targets.length; index++) {
    const item = targets[index];
    const eventKey = Object.keys(item).find(($1) =>
      $1.startsWith("__reactEventHandlers$")
    );
    const instanceKey = Object.keys(item).find(($1) =>
      $1.startsWith("__reactInternalInstance$")
    );
    if (eventKey && instanceKey) {
      return [eventKey, instanceKey];
    }
  }
  return ["", ""];
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
                      isStop: sEvent.cancelable,
                      target: sEvent.currentTarget,
                      status,
                      event: sEvent as any,
                      component:
                        sEvent.currentTarget[
                          ReactEventStepInfo.ReactInstanceName
                        ]?._debugOwner?.elementType,
                      function: res,
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
  }

  eventCeaseLog(step: EventStep, tree: EventTree) {
    console.log(`output->11111`, this.execStatus, tree);
  }
}
