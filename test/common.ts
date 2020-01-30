import sinon from "sinon";
import chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;

const html =
  '<!doctype html><html><head><meta charset="utf-8">' +
  "</head><body></body></html>";
export { sinon, expect, html };
