/* eslint-disable @typescript-eslint/no-unused-vars */
import { BrowserFake } from "webextensions-api-fake";
import { Background } from "~/background";
import { JSDOM } from "jsdom";

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
      background: Background;
      dom: JSDOM;
      clock: sinon.SinonFakeTimers;
    }
  }
}
