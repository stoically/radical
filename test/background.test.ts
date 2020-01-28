import { JSDOM } from "jsdom";
import browserFake, { BrowserFake } from "webextensions-api-fake";
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
import { initialize as riotInitialize } from "../src/riot";

const html =
  '<!doctype html><html><head><meta charset="utf-8">' +
  "</head><body></body></html>";

describe("WebExtension", function() {
  describe("Background", function() {
    beforeEach(function() {
      this.dom = new JSDOM(html);
      this.browser = browserFake();
      this.browser.runtime.getManifest.returns({
        version: "1.2.3",
        applications: {
          gecko: {}
        }
      });
      this.browser.windows.getAll.resolves([
        { id: this.browser.windows.WINDOW_ID_CURRENT }
      ]);

      this.riotInitializeScript = async (): Promise<BrowserFake> => {
        const riotBrowser = browserFake();
        await riotInitialize(riotBrowser);
        this.browser.runtime.sendMessage.callsFake((...args) => {
          riotBrowser.runtime.onMessage.addListener.yield(...args);
        });
        riotBrowser.runtime.sendMessage.callsFake((...args) => {
          this.browser.runtime.onMessage.addListener.yield(...args);
        });

        return riotBrowser;
      };

      this.clock = sinon.useFakeTimers();

      global.browser = global.chrome = this.browser;
      global.window = this.dom.window;
      // eslint-disable-next-line @typescript-eslint/camelcase
      global.window.__riot_test__ = true;
      global.window.location.hash = "#/welcome";
      global.document = this.dom.window.document;
      global.document.createElement = sinon.stub().resolves();

      this.background = new Background();
    });

    afterEach(function() {
      this.browser.sinonSandbox.reset();
      this.clock.restore();

      delete global.window;
      delete global.browser;
      delete global.chrome;
      delete this.dom;
      delete this.browser;
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

      const riotScriptBrowser = await this.riotInitializeScript();
      riotScriptBrowser.tabs.getCurrent.resolves(tab);

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
          cookieStoreId: tab.cookieStoreId,
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

      const riotScriptBrowser = await this.riotInitializeScript();
      riotScriptBrowser.tabs.getCurrent.resolves(tab);

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
          cookieStoreId: tab.cookieStoreId,
          url: tab.url
        })
      );
    });
  });
});
