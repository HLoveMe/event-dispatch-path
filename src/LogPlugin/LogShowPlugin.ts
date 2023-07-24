import {
  ResultShowPlugin,
  EventStatus,
  EventStep,
  EventTreeAble,
} from "../type";
export class LogShowPlugin implements ResultShowPlugin {
  pluginName = "LogShowPlugin";
  show(tree: EventTreeAble): void {
    const capture = tree.execStatus.get(EventStatus.capture) || [];
    const target = tree.execStatus.get(EventStatus.target) || [];
    const bubbling = tree.execStatus.get(EventStatus.bubbling) || [];
    const cloumn = (tree.paths.length - 1) * 2;
    const table: [{ step: EventStep; infos: string[] } | null][] = [];
    const lastStep: EventStep = [...capture, ...target, ...bubbling]
      .filter(($1) => !!$1)
      .pop() as EventStep;
    if (!lastStep) return;
    const stepName = [...capture, target[0]].some(($1) => $1 === lastStep)
      ? "捕获"
      : "冒泡";
    const getDescribe = (infos: [number, EventStep][]) => {
      const row = new Array(cloumn).fill(null);
      infos.forEach((info) => {
        const [index, step] = info;
        if (index === -1) return;
        const infos = tree.plugins.map(($1) => $1.getDescribe(step));
        row[index] = {
          infos,
          step,
        };
      });
      return row;
    };
    new Array(tree.paths.length - 2).fill(0).forEach((_, index) => {
      const _index = tree.paths.length - index - 2 - 1;
      const indexInfo = capture[index];
      const _indexInfo = bubbling[_index];
      const row = getDescribe([
        [index, indexInfo],
        _indexInfo ? [cloumn - index - 1, _indexInfo] : [-1, {} as EventStep],
      ]);
      table.push(row as any);
    });
    if (target.length >= 1) {
      const row = getDescribe([
        [tree.paths.length - 2, target[0]],
        target[1] ? [tree.paths.length - 1, target[1]] : [-1, {} as EventStep],
      ]);
      table.push(row as any);
    }
    const extable = table.map(($1) => {
      const item = $1.find(($1) => $1 && $1.step && $1.infos);
      if (!item) return [];
      return [
        ...$1.map(($2) => {
          return $2 ? `${$2.step.status} : ${$2.infos.join("\r\n")}` : "";
        }),
        item.step.target,
      ];
    });
    console.log(
      `-------------------------start-----------------------------------`
    );
    console.table(extable);
    console.log(
      `%c事件(${tree.type})流结束,结束于(${stepName}),最后响应元素:`,
      "color: red",
      [lastStep.target]
    );
    tree.plugins.forEach(($1) => $1.eventCeaseLog(lastStep, tree));
    console.log(
      `--------------------------end----------------------------------`
    );
  }
}
