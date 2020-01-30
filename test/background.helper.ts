import { JSDOM } from "jsdom";
import sinon from "sinon";
import browserFake from "webextensions-api-fake";
import { ImportMock } from "ts-mock-imports";
import chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;
export { sinon, expect };

import { Background } from "~/background";
import { listener as riotListener } from "~/riot";

import * as utils from "~/utils";
import { Message, MessageResponse } from "~/types";
const injectScriptStub = ImportMock.mockFunction(utils, "injectScript");
injectScriptStub.resolves();

export class BackgroundHelper {
  public defaultTab!: browser.tabs.Tab;

  private context!: Mocha.Context;
  private html =
    '<!doctype html><html><head><meta charset="utf-8">' +
    "</head><body></body></html>";

  async initialize(context: Mocha.Context, browserType: string): Promise<this> {
    context.dom = new JSDOM(this.html);
    context.clock = sinon.useFakeTimers();
    global.window = context.dom.window;
    global.window.location.hash = "#/welcome";
    global.document = context.dom.window.document;
    global.document.createElement = sinon.stub().resolves();

    context.riot = browserFake();
    riotListener(context.riot);

    context.browser = browserFake();
    context.browser.runtime.getManifest.returns(
      this.browserManifest(browserType)
    );
    context.browser.windows.getAll.resolves([
      { id: context.browser.windows.WINDOW_ID_CURRENT }
    ]);
    context.browser.runtime.sendMessage.callsFake((...args) => {
      context.riot.runtime.onMessage.addListener.yield(...args);
    });
    context.riot.runtime.sendMessage.callsFake((...args) => {
      context.browser.runtime.onMessage.addListener.yield(...args);
    });
    global.browser = context.browser;
    context.background = new Background();

    this.context = context;
    this.context.helper = this;

    this.defaultTab = await this.createTab();
    context.browser.tabs.create.resetHistory();
    context.browser.tabs.update.resetHistory();

    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage(message: Message, sender?: browser.tabs.Tab): MessageResponse {
    const [
      messagePromise
    ] = (this.context.browser.runtime.onMessage.addListener.yield(
      message,
      sender || { tab: this.defaultTab }
    ) as unknown) as MessageResponse[];

    return messagePromise;
  }

  async createTab(): Promise<browser.tabs.Tab> {
    const [
      tabPromise
    ] = (this.context.browser.browserAction.onClicked.addListener.yield() as unknown) as Promise<
      browser.tabs.Tab
    >[];
    const tab = await tabPromise;

    await this.context.browser.tabs.update(tab.id, {
      url: tab.url + window.location.hash
    });

    this.context.riot.tabs.getCurrent.resolves(tab);

    return tab;
  }

  updateAvailable(version?: string): void {
    this.context.browser.runtime.onUpdateAvailable.addListener.yield({
      version: version || "1.2.4"
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async afterClock(promise: Promise<any>): Promise<void> {
    await this.nextTick();
    this.context.clock.runAll();
    await promise;
  }

  nextTick(): Promise<void> {
    return new Promise(resolve => process.nextTick(resolve));
  }

  browserManifest(browserType: string): any {
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
  }

  cleanup(): void {
    this.context.browser.sinonSandbox.reset();
    this.context.riot.sinonSandbox.reset();
    this.context.clock.restore();

    delete global.window;
    delete global.browser;
    delete global.chrome;
    delete this.context.dom;
    delete this.context.browser;
    delete this.context.riot;
  }
}
