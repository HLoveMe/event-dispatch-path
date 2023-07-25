import {
  EventInfoPlugin,
  EventName,
  EventTreeAble,
  ResultShowPlugin,
} from "./dist/types/type";

export function eventListener(
  type: EventName,
  stepPlugins: { new (): EventInfoPlugin }[],
  logs: { new (): ResultShowPlugin }[]
): EventTreeAble;

export default function listenerDefaultEventTreer<
  T extends EventName | EventName[]
>(
  type: T,
  stepPlugins?: { new (): EventInfoPlugin }[],
  logs?: { new (): ResultShowPlugin }[]
): T extends Array<any> ? Array<EventTreeAble> : EventTreeAble;
