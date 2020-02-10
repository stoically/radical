import { expect, browserTypes } from "test/common";
import { BackgroundHelper } from "test/background.helper";

browserTypes.map(browserType => {
  describe(`Background SSO: ${browserType}`, function() {
    beforeEach(async function() {
      this.helper = await new BackgroundHelper().initialize(this, browserType);
    });

    afterEach(function() {
      this.helper.cleanup();
    });

    it("should handle SSO login", async function() {
      const tab = this.helper.defaultTab;
      const url = "https://example.org/sso/login";
      const responsePattern = "https://example.org/*";
      await this.helper.sendMessage({
        type: "ssoLogin",
        url,
        responsePattern,
      });

      expect(this.browser.webRequest.onHeadersReceived.addListener).to.have.been
        .calledOnce;
      expect(this.browser.tabs.update).to.have.been.calledOnceWith(tab.id, {
        url,
      });

      this.browser.tabs.update.resetHistory();
      const extensionUrl = "http://cantuseextensionscheme/riot/index.html";
      this.browser.runtime.getURL.returns(extensionUrl);
      this.browser.webRequest.onHeadersReceived.addListener.yield({
        url: "https://example.org/sso/auth_response",
        responseHeaders: [{ name: "Location", value: extensionUrl }],
      });

      expect(this.browser.webRequest.onHeadersReceived.removeListener).to.have
        .been.calledOnce;

      expect(this.browser.tabs.update).to.have.been.calledOnceWith(tab.id, {
        url: extensionUrl,
      });
    });

    it("should remove the listener after timeout", async function() {
      const url = "https://example.org/sso/login";
      const responsePattern = "https://example.org/*";
      await this.helper.sendMessage({
        type: "ssoLogin",
        url,
        responsePattern,
      });

      this.clock.runAll();
      expect(this.browser.webRequest.onHeadersReceived.removeListener).to.have
        .been.calledOnce;
    });

    it("should not redirect if there is no redirect header", async function() {
      const url = "https://example.org/sso/login";
      const responsePattern = "https://example.org/*";
      await this.helper.sendMessage({
        type: "ssoLogin",
        url,
        responsePattern,
      });

      this.browser.tabs.update.resetHistory();
      const extensionUrl = "http://cantuseextensionscheme/riot/index.html";
      this.browser.runtime.getURL.returns(extensionUrl);
      this.browser.webRequest.onHeadersReceived.addListener.yield({
        url: "https://example.org/sso/auth_response",
      });

      expect(this.browser.tabs.update).to.not.have.been.called;
    });

    it("should not redirect if the redirect header does not point to the extension", async function() {
      const url = "https://example.org/sso/login";
      const responsePattern = "https://example.org/*";
      await this.helper.sendMessage({
        type: "ssoLogin",
        url,
        responsePattern,
      });

      this.browser.tabs.update.resetHistory();
      const extensionUrl = "http://cantuseextensionscheme/riot/index.html";
      this.browser.runtime.getURL.returns(extensionUrl);
      this.browser.webRequest.onHeadersReceived.addListener.yield({
        url: "https://example.org/sso/auth_response",
        responseHeaders: [
          { name: "Location", value: "https://somewhereelse.com" },
        ],
      });

      expect(this.browser.tabs.update).to.not.have.been.called;
    });

    it("should throw an error when internal message sender is missing", async function() {
      const promise = this.helper.sendMessage(
        {
          type: "ssoLogin",
          url: "fake",
          responsePattern: "fake",
        },
        ({} as unknown) as browser.tabs.Tab
      );

      await expect(promise).to.eventually.be.rejected;
    });
  });
});
