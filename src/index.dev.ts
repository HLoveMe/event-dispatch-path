import { EventTree } from "./Listener";
import { LogShowPlugin } from "./LogPlugin/LogShowPlugin";
import { DispatchEventInfo } from "./StepPlugin/DispatchEventInfo";
import { VueComponentStep } from "./StepPlugin/VueComponentStep";
import { EventInfoPlugin, EventName, ResultShowPlugin } from "./type";

export function eventListener(
  type: EventName,
  stepPlugins: { new (): EventInfoPlugin }[],
  logs: { new (): ResultShowPlugin }[]
): EventTree {
  const tree = new EventTree(type);
  tree.addPlugins(stepPlugins.map((Con) => Reflect.construct(Con, [])));
  tree.addLogPlugins(logs.map((Con) => Reflect.construct(Con, [])));
  return tree;
}

export default function listenerDefaultEventTree(
  type: EventName | EventName[],
  stepPlugins: { new (): EventInfoPlugin }[] = [],
  logs: { new (): ResultShowPlugin }[] = []
) {
  if (Array.isArray(type)) {
    return type.map(($1) => {
      const tree = eventListener(
        $1,
        [VueComponentStep, DispatchEventInfo],
        [LogShowPlugin]
      );
      tree.addPlugins(stepPlugins.map((Con) => Reflect.construct(Con, [])));
      tree.addLogPlugins(logs.map((Con) => Reflect.construct(Con, [])));
      return tree;
    });
  } else {
    const tree = eventListener(
      type,
      [VueComponentStep, DispatchEventInfo],
      [LogShowPlugin]
    );
    tree.addPlugins(stepPlugins.map((Con) => Reflect.construct(Con, [])));
    tree.addLogPlugins(logs.map((Con) => Reflect.construct(Con, [])));
    return tree;
  }
}
