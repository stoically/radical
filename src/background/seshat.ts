import { Background } from "./lib";

const BOOSTER_PACK_ID = "@riot-booster-pack";

export class Seshat {
  private boosterPackReady = false;
  private bg: Background;

  constructor(bg: Background) {
    this.bg = bg;

    browser.runtime.onMessageExternal.addListener(
      (message: any, sender: browser.runtime.MessageSender) => {
        if (sender.id !== BOOSTER_PACK_ID) {
          throw new Error("Permission denied");
        }

        if (message?.method === "ready") {
          this.boosterPackReady = true;
        }
      }
    );
  }

  async handleMessage(
    message: any,
    sender: browser.runtime.MessageSender
  ): Promise<any> {
    if (!this.boosterPackReady) {
      // riot might call us without asking supportsEventIndexing first, so we
      // no-op in this case
      return;
    }

    const cookieStore =
      this.bg.browserType === "firefox"
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          sender.tab!.cookieStoreId!
        : "default";
    message.eventStore = `webext-${this.bg.runtimeURL.hostname}-${cookieStore}`;

    switch (message.method) {
      case "supportsEventIndexing":
        if (!this.boosterPackReady) {
          return false;
        }
      // fallthrough

      default:
        return browser.runtime.sendMessage(BOOSTER_PACK_ID, message);
    }
  }
}
