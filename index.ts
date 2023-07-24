import { EventInfoPlugin, EventName, EventStatus, EventStep, EventTreeAble, ResultShowPlugin } from "./dist/types/type";

class ShamEventTree implements EventTreeAble{
    activeTime: Date;
    paths: EventTarget[];
    type: keyof WindowEventMap;
    source: Event;
    plugins: EventInfoPlugin[];
    resulePlugin: any[];
    execStatus: Map<EventStatus, EventStep[]>;
}

export function eventListener(type: EventName, stepPlugins: { new (): EventInfoPlugin }[], logs: { new (): ResultShowPlugin }[]): EventTreeAble {
    return new ShamEventTree();
  }

  export default function listenerDefaultEventTree(type: EventName, stepPlugins: { new (): EventInfoPlugin }[], logs: { new (): ResultShowPlugin }[]) {
   return eventListener(type, [], []);
  }