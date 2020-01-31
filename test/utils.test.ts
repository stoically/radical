import { expect, sinon } from "./common";
import { injectScript } from "~/utils";

describe("Utils", () => {
  it("injectScript", async function() {
    const scriptFake = {
      onload: sinon.stub(),
    };
    global.document = {
      createElement: sinon.stub().returns(scriptFake),
      body: {
        append: sinon.stub(),
      },
    };

    const injected = injectScript("foo.js");
    scriptFake.onload();
    await injected;

    expect(global.document.body.append).to.have.been.calledOnce;
  });
});
