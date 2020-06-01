import { Logger } from "../log";
import { Message, MessageResponse } from "../types.js";
import { Config } from "./config";
import { Update } from "./update";
import { NativePort } from "./native";

export class Background extends Logger {
  public webappPath = "/riot/index.html";
  public manifest = browser.runtime.getManifest();
  public version = this.manifest.version;
  public browserType = this.manifest.applications?.gecko ? "firefox" : "chrome";
  public runtimeURL = new URL(browser.runtime.getURL("/"));

  public config = new Config();
  public update = new Update(this);
  public native = new NativePort(this);

  constructor() {
    super();
    // listeners must be set up sync
    // TODO: move into persistent event handler wrapper
    this.logScope("constructor").debug("Browser:", this.browserType);
    browser.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    browser.runtime.onUpdateAvailable.addListener(
      this.update.handleUpdateAvailable.bind(this.update)
    );
    browser.browserAction.onClicked.addListener(this.createTab.bind(this));
  }

  initialize(): this {
    this.logScope("initialize").debug("Initializing");
    browser.storage.local.set({ version: this.version });
    this.update.maybeUpdated();
    return this;
  }

  async handleInstalled(details: {
    reason: browser.runtime.OnInstalledReason;
    temporary: boolean;
  }): Promise<browser.tabs.Tab | undefined> {
    const { debug } = this.logScope("handleInstalled");
    debug("onInstalled", details);

    if (details.temporary) {
      Logger.DEBUG = true;
    }

    switch (details.reason) {
      case "install":
        debug("First install, opening Riot tab");
        return this.createTab();

      // istanbul ignore next
      case "update":
        if (details.temporary) {
          return this.createTab();
        }
    }
  }

  async handleMessage(
    message: Message,
    sender: browser.runtime.MessageSender
  ): MessageResponse {
    const log = this.logScope("handleMessage");
    log.debug("Incoming message", message);
    if (!sender?.tab?.id) {
      throw new Error("handleMessage: missing sender tab");
    }

    switch (message.type) {
      case "version":
        return this.version;

      case "installUpdate":
        return this.update.installUpdate();

      case "activeTab":
        return this.update.activeTab({
          tabId: message.tabId,
          hash: message.hash,
        });

      case "config":
        return this.config.get();

      case "seshat":
      case "keytar":
        return this.native.handleRuntimeMessage(message, sender);
    }
  }

  async createTab(): Promise<browser.tabs.Tab> {
    const { debug } = this.logScope("createTab");
    debug("Creating riot tab");
    return browser.tabs.create({
      url: this.webappPath,
    });
  }
}
