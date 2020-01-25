import { Background } from "./background";

declare global {
  interface Window {
    background: Background;
  }
}
