import { Logger } from "./log";
import { Message, MessageResponse } from "./types.js";
import { Config } from "./background/config";
import { Update } from "./background/update";
import { SSO } from "./background/sso";

declare global {
  interface Window {
    background: Background;
  }
}

export class Background extends Logger {
  public webappPath = "/riot/index.html";
  public manifest = browser.runtime.getManifest();
  public version = this.manifest.version;
  public browserType = this.manifest.applications?.gecko ? "firefox" : "chrome";

  public config = new Config(this);
  public update = new Update(this);
  public sso = new SSO(this);

  constructor() {
    super();
    this.logScope("constructor").debug("Browser:", this.browserType);

    // TODO: move into persistent event handler wrapper
    browser.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    browser.runtime.onUpdateAvailable.addListener(
      this.update.handleUpdateAvailable.bind(this.update)
    );
    browser.browserAction.onClicked.addListener(this.createTab.bind(this));
    browser.storage.local.set({ version: this.version });

    this.update.maybeUpdated();
  }

  async handleInstalled(details: {
    reason: browser.runtime.OnInstalledReason;
    temporary: boolean;
  }): Promise<browser.tabs.Tab | undefined> {
    const { debug } = this.logScope("handleInstalled");
    debug("onInstalled", details);
    switch (details.reason) {
      case "install":
        debug("First install, opening Riot tab");
        return this.createTab();

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
    const { debug } = this.logScope("handleMessage");
    debug("Incoming message", message);

    switch (message.method) {
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

      case "ssoLogin":
        if (!sender.tab?.id) {
          debug("ssoLogin: missing sender tab id");
          return;
        }
        return this.sso.handleLogin(
          message.url,
          message.responsePattern,
          sender.tab.id
        );
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

if (typeof window !== "undefined") {
  window.background = new Background();
}
