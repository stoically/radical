import sinon from "sinon";
import chai from "chai";
import sinonChai from "sinon-chai";
import { BrowserFake } from "webextensions-api-fake/dist";
import { MessageResponse } from "~/types";
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

export { sinon, expect };

global.afterEach(() => {
  delete global.browser;
  delete global.chrome;
  delete global.window;
  delete global.document;
});
