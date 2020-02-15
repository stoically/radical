import { Logger } from "~/log";
import { Background } from "./lib";

const RADICAL_NATIVE_ID = "@radical-native";

export class Seshat extends Logger {
  private radicalNativeReady = false;
  private bg: Background;

  constructor(bg: Background) {
    super();
    this.bg = bg;

    browser.runtime.onMessageExternal.addListener(
      (message: any, sender: browser.runtime.MessageSender) => {
        this.logScope("onMessageExternal").debug("incoming", message, sender);
        if (sender.id !== RADICAL_NATIVE_ID) {
          throw new Error("Permission denied");
        }

        if (message?.method === "ready") {
          this.radicalNativeReady = true;
        }
      }
    );
  }

  async handleMessage(
    message: any,
    sender: browser.runtime.MessageSender
  ): Promise<any> {
    if (!this.radicalNativeReady) {
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
        if (!this.radicalNativeReady) {
          return false;
        }
      // fallthrough

      default:
        return browser.runtime.sendMessage(RADICAL_NATIVE_ID, message);
    }
  }
}
