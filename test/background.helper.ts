import browserFake from "webextensions-api-fake";
import { ImportMock } from "ts-mock-imports";

import { sinon, nextTick } from "./common";
import { Message, MessageResponse } from "~/types";
import * as utils from "~/utils";

import { Background } from "~/background/lib";
import { listener as riotListener } from "~/riot/lib";

interface Manifest {
  version: string;
  applications?: {
    gecko?: unknown;
  };
}

export class BackgroundHelper {
  public defaultTab!: browser.tabs.Tab;

  private context!: Mocha.Context;
  private injectScriptStub!: sinon.SinonStub;

  async initialize(context: Mocha.Context, browserType: string): Promise<this> {
    this.injectScriptStub = ImportMock.mockFunction(utils, "injectScript");
    this.injectScriptStub.resolves();

    context.clock = sinon.useFakeTimers();
    global.window.location.hash = "#/welcome";
    global.document.createElement = sinon.stub().resolves();

    context.riot = browserFake();
    riotListener(context.riot);

    context.browser = browserFake();
    context.browser.runtime.getManifest.returns(
      this.browserManifest(browserType)
    );
    context.browser.windows.getAll.resolves([
      { id: context.browser.windows.WINDOW_ID_CURRENT },
    ]);
    context.browser.runtime.sendMessage.callsFake((...args: unknown[]) => {
      context.riot.runtime.onMessage.addListener.yield(...args);
    });
    context.riot.runtime.sendMessage.callsFake(async (...args) => {
      if (!args[1]) {
        args.push({ tab: this.defaultTab });
      }
      context.browser.runtime.onMessage.addListener.yield(...args);
    });
    // eslint-disable-next-line no-restricted-globals
    global.browser = (context.browser as unknown) as typeof browser;
    context.background = new Background();

    this.context = context;
    this.context.helper = this;

    this.defaultTab = await this.createTab();
    context.browser.tabs.create.resetHistory();
    context.browser.tabs.update.resetHistory();

    return this;
  }

  cleanup(): void {
    this.context.browser.sinonSandbox.reset();
    this.context.riot.sinonSandbox.reset();
    this.context.clock.restore();
    this.injectScriptStub.restore();

    delete this.context;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage(message: Message, sender?: browser.tabs.Tab): MessageResponse {
    const [
      messagePromise,
    ] = (this.context.browser.runtime.onMessage.addListener.yield(
      message,
      sender || { tab: this.defaultTab }
    ) as unknown) as MessageResponse[];

    return messagePromise;
  }

  async createTab(): Promise<browser.tabs.Tab> {
    const [
      tabPromise,
    ] = (this.context.browser.browserAction.onClicked.addListener.yield() as unknown) as Promise<
      browser.tabs.Tab
    >[];
    const tab = await tabPromise;

    await this.context.browser.tabs.update(tab.id, {
      url: tab.url + window.location.hash,
    });

    this.context.riot.tabs.getCurrent.resolves(tab);

    return tab;
  }

  updateAvailable(version?: string): void {
    this.context.browser.runtime.onUpdateAvailable.addListener.yield({
      version: version || "1.2.4",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async afterClock(promise: Promise<any>): Promise<void> {
    await this.nextTick();
    this.context.clock.runAll();
    await promise;
  }

  nextTick(): Promise<void> {
    return nextTick();
  }

  browserManifest(browserType: string): Manifest {
    switch (browserType) {
      case "firefox":
        return {
          version: "1.2.3",
          applications: {
            gecko: {},
          },
        };

      default:
        return { version: "1.2.3" };
    }
  }
}
