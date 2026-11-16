import { JSDOM } from "jsdom"

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
})

for (const key of [
  "window",
  "document",
  "HTMLElement",
  "Node",
  "Storage",
  "StorageEvent",
  "CustomEvent",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "localStorage",
  "getComputedStyle",
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === "window" ? dom.window : dom.window[key],
  })
}

Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
})

globalThis.IS_REACT_ACT_ENVIRONMENT = true
