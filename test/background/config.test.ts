import { browserTypes, expect } from "test/common";
import { BackgroundHelper } from "test/background.helper";
import { MessageConfigResponse } from "~/types";
import decache from "decache";

browserTypes.map(browserType => {
  describe(`Background Config: ${browserType}`, function() {
    beforeEach(async function() {
      this.helper = await new BackgroundHelper().initialize(this, browserType);
    });

    afterEach(function() {
      this.helper.cleanup();
      decache("~/../riot-web/config.sample.json");
    });

    it("should return the default config", async function() {
      const config = (await this.helper.sendMessage({
        type: "config",
      })) as MessageConfigResponse;
      expect(config.brand).to.be.equal("Riot");
    });

    it("should return the custom config if modified", async function() {
      await this.browser.storage.local.set({
        riotConfigDefault: { brand: "Custom" },
      });
      const config = (await this.helper.sendMessage({
        type: "config",
      })) as MessageConfigResponse;
      expect(config.brand).to.be.equal("Custom");
    });

    if (browserType === "firefox") {
      it("should disable piwik in firefox", async function() {
        const config = (await this.helper.sendMessage({
          type: "config",
        })) as MessageConfigResponse;
        expect(config.piwik).to.be.equal(false);
      });
    }
  });
});
