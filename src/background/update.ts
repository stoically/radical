import { Background } from "~/background/lib";
import { Logger } from "~/log";

interface ActiveTab {
  tabId: number;
  hash: string;
}

interface UpdateTab extends browser.tabs.Tab {
  hash: string;
}

export class Update extends Logger {
  private activeTabs: ActiveTab[] = [];
  private bg: Background;

  constructor(bg: Background) {
    super();
    this.bg = bg;
  }

  async maybeUpdated(): Promise<boolean> {
    const { debug } = this.logScope("maybeUpdated");
    const { update } = await browser.storage.local.get("update");
    if (!update) {
      return false;
    }

    debug("Updated", update);
    try {
      const windows = await browser.windows.getAll();
      const windowIds = windows.map(window => window.id);

      await Promise.all(
        update.tabs.map((tab: UpdateTab) => {
          debug("Reopening tab", tab);
          tab.url = this.bg.webappPath + tab.hash;
          delete tab.hash;

          if (this.bg.browserType !== "firefox") {
            delete tab.cookieStoreId;
          }

          if (windowIds.includes(tab.windowId)) {
            return browser.tabs.create(tab);
          } else {
            const createData: { url: string; cookieStoreId?: string } = {
              url: tab.url,
            };
            if (this.bg.browserType === "firefox") {
              createData.cookieStoreId = tab.cookieStoreId;
            }
            return browser.windows.create(createData);
          }
        })
      );
    } catch (error) {
      throw new Error("Reopening tabs after update failed");
    }

    await browser.storage.local.remove("update");
    return true;
  }

  handleUpdateAvailable(details: { version: string }): void {
    const { debug } = this.logScope("handleUpdateAvailable");
    debug("Update available", details);
    this.bg.version = details.version;
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
              this.bg.browserType === "firefox" ? tab.cookieStoreId : false,
          };
        })
      );

      await browser.storage.local.set({
        update: {
          version: this.bg.version,
          tabs,
        },
      });

      this.activeTabs = [];
      browser.runtime.reload();
    } catch (error) {
      throw new Error("updating failed");
    }
  }

  activeTab(tab: ActiveTab): void {
    this.activeTabs.push(tab);
  }
}
