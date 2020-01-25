import browserFake from "webextensions-api-fake";
import sinon from "sinon";
import chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;

import { Background } from "../src/background";

describe("WebExtension", function() {
  describe("Background", function() {
    beforeEach(function() {
      this.browser = browserFake();
      this.browser.runtime.getManifest.returns({
        version: "1.2.3"
      });
      this.browser.windows.getAll.resolves([
        { id: this.browser.windows.WINDOW_ID_CURRENT }
      ]);

      global.browser = this.browser;
      global.window = {};
      this.background = new Background();
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
      const hash = "#/welcome";
      await browser.tabs.update(tab.id, { url: tab.url + hash });

      this.browser.tabs.getCurrent.resolves(tab);
      this.browser.extension.getViews.returns([
        {
          location: {
            pathname: this.background.webappPath,
            hash
          },
          browser: this.browser
        }
      ]);

      const [
        messagePromise
      ] = (this.browser.runtime.onMessage.addListener.yield({
        method: "installUpdate"
      }) as unknown) as Promise<any>[];
      await messagePromise;
      expect(this.browser.runtime.reload).to.have.been.calledOnce;

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
      const hash = "#/welcome";
      await browser.tabs.update(tab.id, { url: tab.url + hash });

      this.browser.tabs.getCurrent.resolves(tab);
      this.browser.extension.getViews.returns([
        {
          location: {
            pathname: this.background.webappPath,
            hash
          },
          browser: this.browser
        }
      ]);

      const [
        messagePromise
      ] = (this.browser.runtime.onMessage.addListener.yield({
        method: "installUpdate"
      }) as unknown) as Promise<any>[];
      await messagePromise;

      this.browser.sinonSandbox.resetHistory();
      this.browser.windows.getAll.resolves([]);
      this.background = new Background();
      await new Promise(resolve => process.nextTick(resolve));

      expect(this.browser.windows.create).to.have.been.calledOnceWith(
        sinon.match({
          url: tab.url
        })
      );
    });
  });
});
