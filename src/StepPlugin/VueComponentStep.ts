import { isVue } from "../EventUtil";
import {
  EventInfoPlugin,
  EventName,
  EventStep,
  EventTreeAble,
  VueEventStep,
} from "../type";

type Node = {
  type?: { __file?: string; name?: string };
  __v_isVNode: boolean;
  vnode?: Node;
};
export type VueNodeHTML = HTMLElement & {
  _vnode?: Node;
  __vueParentComponent?: Node;
};

const getVNodeInfo = (
  el: HTMLElement
): { file: string; name: string } | null => {
  const getVNode = (node?: Node, depth = 10) => {
    if (depth === 0) return null;
    if (!node) return null;
    if (node.__v_isVNode === true) {
      return {
        file: node.type?.__file,
        name: node.type?.name,
      };
    }
    return getVNode(node.vnode, depth - 1);
  };
  const node =
    (el as VueNodeHTML).__vueParentComponent || (el as VueNodeHTML)._vnode;
  if (!node) return null;
  return getVNode(node);
};

export class VueComponentStep implements EventInfoPlugin {
  pluginName = "VueEventStep";

  isVisiable = true;

  isVue = false;

  constructor() {
    this.isVue = isVue()
  }

  onWindowDispatch(type: EventName, event: Event): void {
    this.isVisiable = this.isVue;
  }

  handle(step: EventStep): EventStep {
    if (this.isVue === false) return step;
    Object.defineProperty(step, "vue", {
      get() {
        const vnode = getVNodeInfo(this.target);
        return vnode;
      },
    });
    return step;
  }

  getDescribe(stepInfo: VueEventStep): string {
    if (this.isVue === false) return "";
    return stepInfo?.vue ? "Vue:is_vue" : "Vue:no_vue";
  }

  clearStep(stepInfo: EventStep) {}

  clearPlugin(): void {}

  eventCeaseLog(tree: EventTreeAble, lastStep: VueEventStep) {
    if (this.isVue && this.isVisiable) {
      console.log(
        `${this.pluginName}：%c该事件,最后响应Vue组件:`,
        "color: red",
        lastStep.vue
      );
    }
  }
}
