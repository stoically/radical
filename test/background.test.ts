import { JSDOM } from "jsdom";
import browserFake from "webextensions-api-fake";
import { ImportMock } from "ts-mock-imports";
import sinon from "sinon";
import chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;

import * as utils from "../src/utils";
const injectScriptStub = ImportMock.mockFunction(utils, "injectScript");
injectScriptStub.resolves();

import { Background } from "../src/background";
import { listener } from "../src/riot";

const html =
  '<!doctype html><html><head><meta charset="utf-8">' +
  "</head><body></body></html>";

const browserManifest = (browserType: string): any => {
  switch (browserType) {
    case "firefox":
      return {
        version: "1.2.3",
        applications: {
          gecko: {}
        }
      };

    case "chrome":
      return { version: "1.2.3" };
  }
};

const browserTypes = !process.env.BROWSER_TYPE
  ? ["firefox", "chrome"]
  : [process.env.BROWSER_TYPE];

browserTypes.map(browserType => {
  const manifest = browserManifest(browserType);

  describe(`WebExtension Background: ${browserType}`, function() {
    beforeEach(async function() {
      this.dom = new JSDOM(html);
      this.clock = sinon.useFakeTimers();
      global.window = this.dom.window;
      global.window.location.hash = "#/welcome";
      global.document = this.dom.window.document;
      global.document.createElement = sinon.stub().resolves();

      this.riotBrowser = browserFake();
      listener(this.riotBrowser);

      this.browser = browserFake();
      this.browser.runtime.getManifest.returns(manifest);
      this.browser.windows.getAll.resolves([
        { id: this.browser.windows.WINDOW_ID_CURRENT }
      ]);
      this.browser.runtime.sendMessage.callsFake((...args) => {
        this.riotBrowser.runtime.onMessage.addListener.yield(...args);
      });
      this.riotBrowser.runtime.sendMessage.callsFake((...args) => {
        this.browser.runtime.onMessage.addListener.yield(...args);
      });
      global.browser = this.browser;
      this.background = new Background();
    });

    afterEach(function() {
      this.browser.sinonSandbox.reset();
      this.riotBrowser.sinonSandbox.reset();
      this.clock.restore();

      delete global.window;
      delete global.browser;
      delete global.chrome;
      delete this.dom;
      delete this.browser;
      delete this.riotBrowser;
    });

    it("should register event listeners", function() {
      expect(this.browser.runtime.onInstalled.addListener).to.have.been
        .calledOnce;
      expect(this.browser.browserAction.onClicked.addListener).to.have.been
        .calledOnce;
    });

    it("should create riot tab upon installation", function() {
      this.browser.runtime.onInstalled.addListener.yield({
        reason: "install"
      });

      expect(this.browser.tabs.create).to.have.been.calledWithMatch({
        url: this.background.webappPath
      });
    });

    it("should create riot tab when toolbar icon is clicked", function() {
      this.browser.browserAction.onClicked.addListener.yield();
      expect(this.browser.tabs.create).to.have.been.calledWithMatch({
        url: this.background.webappPath
      });
    });

    it("should respond with manifest version", async function() {
      const [promise] = (this.browser.runtime.onMessage.addListener.yield({
        method: "version"
      }) as unknown) as Promise<any>[];
      const version = await promise;

      expect(version).to.equal("1.2.3");
    });

    it("should respond with new version after update", async function() {
      this.browser.runtime.onUpdateAvailable.addListener.yield({
        version: "1.2.4"
      });

      const [promise] = (this.browser.runtime.onMessage.addListener.yield({
        method: "version"
      }) as unknown) as Promise<any>[];
      const version = await promise;

      expect(version).to.equal("1.2.4");
    });

    it("should reopen riot tabs after update", async function() {
      this.browser.runtime.onUpdateAvailable.addListener.yield({
        version: "1.2.4"
      });

      const [
        tabPromise
      ] = (this.browser.browserAction.onClicked.addListener.yield() as unknown) as Promise<
        any
      >[];
      const tab = await tabPromise;
      await this.browser.tabs.update(tab.id, {
        url: tab.url + window.location.hash
      });

      this.riotBrowser.tabs.getCurrent.resolves(tab);

      const [
        messagePromise
      ] = (this.browser.runtime.onMessage.addListener.yield({
        method: "installUpdate"
      }) as unknown) as Promise<any>[];

      await new Promise(resolve => process.nextTick(resolve));
      this.clock.runAll();

      await messagePromise;
      expect(this.browser.runtime.reload).to.have.been.calledOnce;

      this.browser.sinonSandbox.resetHistory();
      this.background = new Background();
      await new Promise(resolve => process.nextTick(resolve));

      expect(this.browser.tabs.create).to.have.been.calledOnceWith(
        sinon.match({
          cookieStoreId:
            browserType === "firefox" ? tab.cookieStoreId : undefined,
          index: tab.index,
          pinned: tab.pinned,
          url: tab.url,
          windowId: tab.windowId,
          hash: undefined
        })
      );

      expect(await this.browser.storage.local.get("update")).to.deep.equal({
        update: undefined
      });
    });

    // TODO: legacy update, remove with next major version
    it("should reopen riot tabs after update", async function() {
      this.browser.runtime.onUpdateAvailable.addListener.yield({
        version: "1.2.4"
      });

      const [
        tabPromise
      ] = (this.browser.browserAction.onClicked.addListener.yield() as unknown) as Promise<
        any
      >[];
      const tab = await tabPromise;

      this.browser.storage.local.set({
        update: {
          version: "1.2.4",
          tabs: [tab]
        }
      });

      this.browser.sinonSandbox.resetHistory();
      this.background = new Background();
      await new Promise(resolve => process.nextTick(resolve));

      expect(this.browser.tabs.create).to.have.been.calledOnceWith(
        sinon.match({
          index: tab.index,
          url: tab.url,
          windowId: tab.windowId
        })
      );

      expect(await this.browser.storage.local.get("update")).to.deep.equal({
        update: undefined
      });
    });

    it("should create new window if it doesn't exist after update", async function() {
      this.browser.runtime.onUpdateAvailable.addListener.yield({
        version: "1.2.4"
      });

      const [
        tabPromise
      ] = (this.browser.browserAction.onClicked.addListener.yield() as unknown) as Promise<
        any
      >[];
      const tab = await tabPromise;
      await this.browser.tabs.update(tab.id, {
        url: tab.url + window.location.hash
      });

      this.riotBrowser.tabs.getCurrent.resolves(tab);

      const [
        messagePromise
      ] = (this.browser.runtime.onMessage.addListener.yield({
        method: "installUpdate"
      }) as unknown) as Promise<any>[];

      await new Promise(resolve => process.nextTick(resolve));
      this.clock.runAll();

      await messagePromise;

      this.browser.sinonSandbox.resetHistory();
      this.browser.windows.getAll.resolves([]);
      this.background = new Background();
      await new Promise(resolve => process.nextTick(resolve));

      expect(this.browser.windows.create).to.have.been.calledOnceWith(
        sinon.match({
          cookieStoreId:
            browserType === "firefox" ? tab.cookieStoreId : undefined,
          url: tab.url
        })
      );
    });

    it("should handle SSO", async function() {
      const tab = await this.browser.tabs.create({});
      const redirectUrl = this.browser.runtime.getURL("riot/index.html");
      await this.browser.webRequest.onHeadersReceived.addListener.yield({
        tabId: tab.id,
        responseHeaders: [
          {
            name: "Location",
            value: redirectUrl
          }
        ]
      });

      expect(this.browser.tabs.update).to.have.been.calledWithMatch(tab.id, {
        url: redirectUrl
      });
    });
  });
});
