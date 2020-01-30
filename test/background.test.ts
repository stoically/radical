import { Background } from "../src/background";
import { BackgroundHelper, expect, sinon } from "./background.helper";

const browserTypes = !process.env.BROWSER_TYPE
  ? ["firefox", "chrome"]
  : [process.env.BROWSER_TYPE];

browserTypes.map(browserType => {
  describe(`WebExtension Background: ${browserType}`, function() {
    beforeEach(async function() {
      this.helper = await new BackgroundHelper().initialize(this, browserType);
    });

    afterEach(function() {
      this.helper.cleanup();
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
      const version = await this.helper.sendMessage({ method: "version" });

      expect(version).to.equal("1.2.3");
    });

    it("should respond with new version after update", async function() {
      this.helper.updateAvailable("1.2.4");
      const version = await this.helper.sendMessage({ method: "version" });

      expect(version).to.equal("1.2.4");
    });

    it("should reopen riot tabs after update", async function() {
      this.helper.updateAvailable();
      const tab = await this.helper.createTab();
      const messagePromise = this.helper.sendMessage({
        method: "installUpdate"
      });
      await this.helper.afterClock(messagePromise);
      expect(this.browser.runtime.reload).to.have.been.calledOnce;

      this.browser.sinonSandbox.resetHistory();
      this.background = new Background();
      await this.helper.nextTick();

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

    it("should create new window if it doesn't exist after update", async function() {
      this.helper.updateAvailable();
      const tab = await this.helper.createTab();
      const messagePromise = this.helper.sendMessage({
        method: "installUpdate"
      });
      await this.helper.afterClock(messagePromise);
      this.browser.sinonSandbox.resetHistory();
      this.browser.windows.getAll.resolves([]);

      this.background = new Background();
      await this.helper.nextTick();

      expect(this.browser.windows.create).to.have.been.calledOnceWith(
        sinon.match({
          cookieStoreId:
            browserType === "firefox" ? tab.cookieStoreId : undefined,
          url: tab.url
        })
      );
    });

    it("should handle SSO login", async function() {
      const tab = this.helper.defaultTab;
      const url = "https://example.org/sso/login";
      const responsePattern = "https://example.org/*";
      await this.helper.sendMessage({
        method: "ssoLogin",
        url,
        responsePattern
      });

      expect(this.browser.webRequest.onHeadersReceived.addListener).to.have.been
        .calledOnce;
      expect(this.browser.tabs.update).to.have.been.calledOnceWith(tab.id, {
        url
      });

      this.browser.tabs.update.resetHistory();
      const extensionUrl = "http://cantuseextensionscheme/riot/index.html";
      this.browser.runtime.getURL.returns(extensionUrl);
      this.browser.webRequest.onHeadersReceived.addListener.yield({
        url: "https://example.org/sso/auth_response",
        responseHeaders: [{ name: "Location", value: extensionUrl }]
      });

      expect(this.browser.webRequest.onHeadersReceived.removeListener).to.have
        .been.calledOnce;

      expect(this.browser.tabs.update).to.have.been.calledOnceWith(tab.id, {
        url: extensionUrl
      });
    });
  });
});
