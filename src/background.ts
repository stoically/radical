import riotConfigBundled from "../riot-web/config.sample.json";

declare global {
  interface Window {
    background: Background;
    vector_indexeddb_worker_script: string;
  }
}

export class Background {
  public webappPath = "/riot/index.html";
  public manifest = browser.runtime.getManifest();
  public version = this.manifest.version;
  public browser = this.manifest.applications?.gecko ? "firefox" : "chrome";
  public activeTabs: { tabId: number; hash: string }[] = [];

  constructor() {
    this.debug("Initializing", this.browser);

    browser.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    browser.runtime.onUpdateAvailable.addListener(
      this.handleUpdateAvailable.bind(this)
    );
    browser.browserAction.onClicked.addListener(this.createTab.bind(this));

    browser.storage.local.set({ version: this.version });

    this.maybeUpdated();
  }

  async handleInstalled(details: {
    reason: browser.runtime.OnInstalledReason;
  }): Promise<browser.tabs.Tab | undefined> {
    this.debug("onInstalled", details);
    switch (details.reason) {
      case "install":
        this.debug("First install, opening Riot tab");
        return this.createTab();
    }
  }

  async maybeUpdated(): Promise<void> {
    const { update } = await browser.storage.local.get("update");
    if (!update) {
      return;
    }

    this.debug("Updated", update);
    try {
      const windows = await browser.windows.getAll();
      const windowIds = windows.map(window => window.id);

      await Promise.all(
        update.tabs.map((tab: any) => {
          this.debug("Reopening tab", tab);
          // TODO: legacy `if`, remove with next major version
          if (!tab.url) {
            let url = this.webappPath;
            if (tab.hash) {
              url += tab.hash;
            }
            tab.url = url;
            delete tab.hash;
          }

          if (this.browser !== "firefox") {
            delete tab.cookieStoreId;
          }

          if (windowIds.includes(tab.windowId)) {
            return browser.tabs.create(tab);
          } else {
            const createData: { url: string; cookieStoreId?: string } = {
              url: tab.url
            };
            if (this.browser === "firefox") {
              createData.cookieStoreId = tab.cookieStoreId;
            }
            return browser.windows.create(createData);
          }
        })
      );
    } catch (error) {
      this.debug("Reopening tabs after update failed", error);
      throw error;
    }

    await browser.storage.local.remove("update");
  }

  async handleMessage(message: any): Promise<any> {
    this.debug("Incoming message", message);

    switch (message.method) {
      case "version":
        return this.version;

      case "installUpdate":
        return this.installUpdate();

      case "activeTab":
        this.activeTabs.push({
          tabId: message.tabId,
          hash: message.hash
        });
        return;

      case "config":
        return this.getConfig();
    }
  }

  handleUpdateAvailable(details: { version: string }): void {
    this.debug("Update available", details);
    this.version = details.version;
  }

  createTab(): Promise<browser.tabs.Tab> {
    this.debug("Creating riot tab");
    return browser.tabs.create({
      url: this.webappPath
    });
  }

  async installUpdate(): Promise<void> {
    try {
      this.activeTabs = [];
      await browser.runtime.sendMessage({ method: "activeTabs" });

      // give tabs 500ms to respond
      // workaround for sendMessage not supporting multiple return messages
      await new Promise(resolve => setTimeout(resolve, 500));

      const tabs = await Promise.all(
        this.activeTabs.map(async ({ tabId, hash }) => {
          const tab = await browser.tabs.get(tabId);

          return {
            index: tab.index,
            pinned: tab.pinned,
            windowId: tab.windowId,
            hash,
            cookieStoreId:
              this.browser === "firefox" ? tab.cookieStoreId : false
          };
        })
      );

      await browser.storage.local.set({
        update: {
          version: this.version,
          tabs
        }
      });

      this.activeTabs = [];
      browser.runtime.reload();
    } catch (error) {
      this.debug("updating failed", error.toString());
      throw error;
    }
  }

  async getConfig(): Promise<any> {
    const { riotConfigDefault } = await browser.storage.local.get([
      "riotConfigDefault"
    ]);

    return riotConfigDefault || riotConfigBundled;
  }

  debug(message: any, ...args: any[]): void {
    console.log(`[WebExtension Background] ${message}`, ...args);
  }
}

if (typeof browser !== "undefined") {
  window.background = new Background();
}
