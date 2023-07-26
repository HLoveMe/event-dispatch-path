export type EventName = keyof WindowEventMap;

export enum EventStatus {
  capture = "⇓",
  target = "⇌",
  bubbling = "⇑",
}

export interface EventStep {
  date: Date;
  type: EventName;
  status: EventStatus;
  target: EventTarget;
  event: Event;
  isStop: boolean;
}

export interface VueEventStep extends EventStep {
  vue?: {
    file: string;
  };
}

export interface ReactEventStep extends EventStep {
  react: {
    file: string;
    component: { name: string };
    function: Function;
    isStop: boolean;
  };
}

export interface EventInfoPlugin {
  pluginName: string;

  isVisiable: boolean;
  // every
  onWindowDispatch(type: EventName, event: Event): void;
  // every
  handle(stepInfo: EventStep): EventStep;
  // every
  getDescribe(stepInfo: EventStep): string;
  // every
  clearStep(stepInfo: EventStep): void;
  // 完成一次监听流
  clearPlugin(): void;

  eventCeaseLog(tree: any, lastStep?: EventStep): void;

  /***
  ------------one event start 
  |
    onWindowDispatch one
  |
    handle more
  |
  -----------log
  |
    getDescribe more
  |
    eventCeaseLog
  |
  ------------one event end
  |
  clearStep more
  |
  clearPlugin one
  |

   */
}

export interface EventTreeAble {
  activeTime: Date;
  paths: EventTarget[];
  type: EventName;
  source: Event;
  plugins: EventInfoPlugin[];
  resulePlugin: any[];
  execStatus: Map<EventStatus, EventStep[]>;
  getEventStopStep(): EventStep;
}

export interface ResultShowPlugin {
  pluginName: string;
  show(tree: EventTreeAble): void;
}
