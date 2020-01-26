import riotConfigBundled from "../riot-web/config.sample.json";

export class Background {
  public webappPath = "/riot/index.html";
  public manifest = browser.runtime.getManifest();
  public version = this.manifest.version;

  constructor() {
    this.debug("Initializing");

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

          if (windowIds.includes(tab.windowId)) {
            return browser.tabs.create(tab);
          } else {
            return browser.windows.create({
              url: tab.url
            });
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
      const tabs = await Promise.all(
        browser.extension
          .getViews({ type: "tab" })
          .filter(view => view.location?.pathname === this.webappPath)
          .map(async view => {
            const tab = await view.browser.tabs.getCurrent();
            return {
              index: tab.index,
              pinned: tab.pinned,
              hash: view.location.hash,
              windowId: tab.windowId
            };
          })
      );

      await browser.storage.local.set({
        update: {
          version: this.version,
          tabs
        }
      });

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
