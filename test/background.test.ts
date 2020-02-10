import * as BackgroundLib from "~/background/lib";
import { BackgroundHelper } from "./background.helper";
import { expect, browserTypes } from "./common";
import { ImportMock } from "ts-mock-imports";

browserTypes.map(browserType => {
  describe(`Background: ${browserType}`, function() {
    beforeEach(async function() {
      this.helper = await new BackgroundHelper().initialize(this, browserType);
    });

    afterEach(function() {
      this.helper.cleanup();
    });

    it("should create riot tab upon installation", function() {
      this.browser.runtime.onInstalled.addListener.yield({
        reason: "install",
      });

      expect(this.browser.tabs.create).to.have.been.calledWithMatch({
        url: this.background.webappPath,
      });
    });

    it("should create riot tab when toolbar icon is clicked", function() {
      this.browser.browserAction.onClicked.addListener.yield();
      expect(this.browser.tabs.create).to.have.been.calledWithMatch({
        url: this.background.webappPath,
      });
    });

    it("should respond with manifest version", async function() {
      const version = await this.helper.sendMessage({ type: "version" });

      expect(version).to.equal("1.2.3");
    });
  });
});

it("should initialize", async function() {
  const backgroundMock = ImportMock.mockClass(BackgroundLib, "Background");
  const initializeStub = backgroundMock.mock("initialize");
  await import("~/background");

  expect(initializeStub).to.have.been.calledOnce;
  backgroundMock.restore();
});
