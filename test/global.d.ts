/* eslint-disable @typescript-eslint/no-unused-vars */
import { BrowserFake } from "webextensions-api-fake";
import { Background } from "~/background";
import { JSDOM } from "jsdom";
import { BackgroundHelper } from "./background.helper";

declare global {
  namespace NodeJS {
    interface Global {
      browser: BrowserFake;
      window: Window;
      document: any;
      chrome: any;
    }
  }

  namespace Mocha {
    interface Context {
      browser: BrowserFake;
      riot: BrowserFake;
      background: Background;
      dom: JSDOM;
      clock: sinon.SinonFakeTimers;
      helper: BackgroundHelper;
    }
  }
}
