/* eslint-disable prettier/prettier */
import { browserTypes, expect } from "test/common";
import { BackgroundHelper } from "test/background.helper";
import { MessageConfigResponse } from "~/types";

browserTypes.map(browserType => {
  describe(`Background Config: ${browserType}`, function() {
    beforeEach(async function() {
      this.helper = await new BackgroundHelper().initialize(this, browserType);
    });

    afterEach(function() {
      this.helper.cleanup();
    });

    it("should return the default config", async function() {
      const config = (await this.helper.sendMessage({
        type: "config",
      })) as MessageConfigResponse;
      console.log(config)
      expect(config.default_server_config["m.homeserver"].server_name).to.be.equal("matrix.org");
    });

    it("should return the custom config if modified", async function() {
      await this.browser.storage.local.set({
        riotConfigDefault: { custom: "toggle" },
      });
      const config = (await this.helper.sendMessage({
        type: "config",
      })) as MessageConfigResponse;
      expect(config.custom).to.be.equal("toggle");
    });
  });
});
