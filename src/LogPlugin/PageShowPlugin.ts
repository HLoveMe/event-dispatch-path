import {
  ResultShowPlugin,
  EventStatus,
  EventStep,
  EventTreeAble,
} from "../type";

class PageShow {}

export class PageShowPlugin implements ResultShowPlugin {
  pluginName = "PageShowPlugin";
  static pageShow = new PageShow();
  show(tree: EventTreeAble): void {}
}
