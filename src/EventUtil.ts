function getTop() {
  var freeGlobal =
    typeof globalThis == "object" &&
    globalThis &&
    globalThis.Object === Object &&
    globalThis;

  var freeSelf =
    // eslint-disable-next-line no-restricted-globals
    typeof self == "object" && self && self.Object === Object && self;

  // eslint-disable-next-line no-new-func
  return freeGlobal || freeSelf || Function("return this")();
}

function isVue() {
  const top = getTop();
  return !!(top as any).__VUE__;
}
const isRootElement = (target: any) => {
  const { stateNode } = target;
  return stateNode.constructor.name === "FiberRootNode";
};

let reactInfo: { keys: string[]; isReact: boolean; isInit: boolean } = {
  keys: [],
  isReact: false,
  isInit: false,
};

function _reactInfo() {
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
}

function getReactInfoKey(): string[] {
  if (reactInfo.isInit === true) return reactInfo.keys;
  const result = _reactInfo();
  reactInfo.keys = result as [string, string];
  reactInfo.isInit = true;
  reactInfo.isReact =
    result.length === 2 && result.every(($1) => $1.length >= 0);
  return result;
}

function isReact() {
  if (reactInfo.isInit === true) return reactInfo.isReact;
  getReactInfoKey();
  return reactInfo.isReact;
}

export { isVue, isReact, getReactInfoKey, isRootElement };
