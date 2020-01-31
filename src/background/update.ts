import { Background } from "~/background";
import { Logger } from "~/log";

interface ActiveTab {
  tabId: number;
  hash: string;
}

export class Update extends Logger {
  private activeTabs: ActiveTab[] = [];
  private bg: Background;

  constructor(bg: Background) {
    super();
    this.bg = bg;
  }

  async maybeUpdated(): Promise<void> {
    const { debug } = this.logger("maybeUpdated");
    const { update } = await browser.storage.local.get("update");
    if (!update) {
      return;
    }

    debug("Updated", update);
    try {
      const windows = await browser.windows.getAll();
      const windowIds = windows.map(window => window.id);

      await Promise.all(
        update.tabs.map((tab: any) => {
          debug("Reopening tab", tab);
          let url = this.bg.webappPath;
          if (tab.hash) {
            url += tab.hash;
          }
          tab.url = url;
          delete tab.hash;

          if (this.bg.browserType !== "firefox") {
            delete tab.cookieStoreId;
          }

          if (windowIds.includes(tab.windowId)) {
            return browser.tabs.create(tab);
          } else {
            const createData: { url: string; cookieStoreId?: string } = {
              url: tab.url
            };
            if (this.bg.browserType === "firefox") {
              createData.cookieStoreId = tab.cookieStoreId;
            }
            return browser.windows.create(createData);
          }
        })
      );
    } catch (error) {
      debug("Reopening tabs after update failed", error);
      throw error;
    }

    await browser.storage.local.remove("update");
  }

  handleUpdateAvailable(details: { version: string }): void {
    const { debug } = this.logger("handleUpdateAvailable");
    debug("Update available", details);
    this.bg.version = details.version;
  }

  async installUpdate(): Promise<void> {
    const { debug } = this.logger("installUpdate");
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
              this.bg.browserType === "firefox" ? tab.cookieStoreId : false
          };
        })
      );

      await browser.storage.local.set({
        update: {
          version: this.bg.version,
          tabs
        }
      });

      this.activeTabs = [];
      browser.runtime.reload();
    } catch (error) {
      debug("updating failed", error.toString());
      throw error;
    }
  }

  activeTab(tab: ActiveTab): void {
    this.activeTabs.push(tab);
  }
}
