import sinon from "sinon";
import chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;

export const html =
  '<!doctype html><html><head><meta charset="utf-8">' +
  "</head><body></body></html>";

export const browserTypes = !process.env.BROWSER_TYPE
  ? ["firefox", "chrome"]
  : [process.env.BROWSER_TYPE];

export { sinon, expect };

global.afterEach(() => {
  delete global.browser;
  delete global.chrome;
  delete global.window;
  delete global.document;
});
