import sinon from "sinon";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import { BrowserFake } from "webextensions-api-fake/dist";
import { MessageResponse } from "~/types";
import { JSDOM } from "jsdom";
chai.use(chaiAsPromised);
chai.use(sinonChai);
const { expect } = chai;

export const html =
  '<!doctype html><html><head><meta charset="utf-8">' +
  "</head><body></body></html>";

export const browserTypes = !process.env.BROWSER_TYPE
  ? ["firefox", "chrome"]
  : [process.env.BROWSER_TYPE];

export const sendMessage = (
  browser: BrowserFake,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any,
  sender?: browser.runtime.MessageSender
): MessageResponse => {
  const [messagePromise] = (browser.runtime.onMessage.addListener.yield(
    message,
    sender
  ) as unknown) as MessageResponse[];

  return messagePromise;
};

export const nextTick = (): Promise<void> =>
  new Promise(resolve => process.nextTick(resolve));

export { sinon, expect };

global.beforeEach(() => {
  global.jsdom = new JSDOM(html);
  global.window = global.jsdom.window;
  global.document = global.jsdom.window.document;
});

global.afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.jsdom;

  delete global.browser;
  delete global.chrome;
});
