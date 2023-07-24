export type EventName = keyof WindowEventMap;

export enum EventStatus {
  capture = '⇓',
  target = '⇌',
  bubbling = '⇑',
}

export interface EventStep {
  data: Date;
  type: EventName;
  status: EventStatus;
  target: EventTarget;
  event: Event;
  isStop: boolean;
  vue_Node?: {
    file: string;
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

  eventCeaseLog(step: EventStep, tree: any): void;

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
}

export interface ResultShowPlugin {
  pluginName: string;
  show(tree: EventTreeAble): void;
}
