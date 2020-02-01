import { Background } from "./background/lib";

declare global {
  interface Window {
    background: Background;
  }
}

window.background = new Background().initialize();
