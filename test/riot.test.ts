import { JSDOM } from "jsdom";
import { ImportMock } from "ts-mock-imports";
import browserFake from "webextensions-api-fake";

import { html, expect, browserTypes } from "./common";
import * as utils from "~/utils";

import * as riot from "~/riot";

browserTypes.map(browserType => {
  describe(`Riot Script ${browserType}`, () => {
    it("listener", async function() {
      const browser = browserFake();
      riot.listener(browser);

      expect(browser.runtime.onMessage.addListener).to.have.been.calledOnce;

      global.window = new JSDOM(html).window;
      global.window.location.hash = "foo";
      const tab = await browser.tabs._create({});
      browser.tabs.getCurrent.returns(tab);
      const [promise] = (browser.runtime.onMessage.addListener.yield({
        method: "activeTabs",
      }) as unknown) as Promise<any>[];
      await promise;

      expect(browser.runtime.sendMessage).to.have.been.calledOnceWithExactly({
        method: "activeTab",
        tabId: tab.id,
        hash: "#foo",
      });
    });

    it("sanitize", function() {
      global.browser = global.chrome = browserFake();
      riot.sanitize();

      expect(Object.keys(global.browser)).to.have.length(3);
      expect(global.chrome).to.be.null;
    });

    it("run", function() {
      const dom = new JSDOM(html);
      global.window = dom.window;
      global.document = dom.window.document;
      const injectScriptStub = ImportMock.mockFunction(utils, "injectScript");
      riot.run();

      expect(global.window.vector_indexeddb_worker_script).to.be.ok;
      expect(injectScriptStub).to.have.been.calledWith(
        "bundles/webext/vendor.js"
      );
      expect(injectScriptStub).to.have.been.calledWith(
        "bundles/webext/bundle.js"
      );

      injectScriptStub.restore();
    });

    it("initialize", async function() {
      const injectScriptStub = ImportMock.mockFunction(utils, "injectScript");
      injectScriptStub.callsFake(() => {
        global.browser = browserFake();
      });
      const sanitizeStub = ImportMock.mockFunction(riot, "sanitize");
      const listenerStub = ImportMock.mockFunction(riot, "listener");
      const runStub = ImportMock.mockFunction(riot, "run");
      if (browserType === "firefox") {
        global.browser = browserFake();
      }

      await riot.initialize();

      if (browserType !== "firefox") {
        expect(injectScriptStub).to.have.been.calledOnce;
      }
      expect(sanitizeStub).to.have.been.calledOnce;
      expect(listenerStub).to.have.been.calledOnce;
      expect(runStub).to.have.been.calledOnce;

      injectScriptStub.restore();
      sanitizeStub.restore();
      listenerStub.restore();
      runStub.restore();
    });
  });
});
