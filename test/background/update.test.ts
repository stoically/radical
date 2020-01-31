import { browserTypes, expect, sinon } from "test/common";
import { BackgroundHelper } from "test/background.helper";
import { Background } from "~/background";

browserTypes.map(browserType => {
  describe(`Background Update: ${browserType}`, function() {
    beforeEach(async function() {
      this.helper = await new BackgroundHelper().initialize(this, browserType);
    });

    afterEach(function() {
      this.helper.cleanup();
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
        method: "installUpdate",
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
          hash: undefined,
        })
      );

      expect(await this.browser.storage.local.get("update")).to.deep.equal({
        update: undefined,
      });
    });

    it("should create new window if it doesn't exist after update", async function() {
      this.helper.updateAvailable();
      const tab = await this.helper.createTab();
      const messagePromise = this.helper.sendMessage({
        method: "installUpdate",
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
          url: tab.url,
        })
      );
    });
  });
});
