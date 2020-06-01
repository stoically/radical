import { Logger } from "~/log";
import { Background } from "./lib";

export class NativePort extends Logger {
  private name =
    process.env.NODE_ENV === "development"
      ? "radical.native.dev"
      : "radical.native";
  private port?: browser.runtime.Port;
  private rpcId = 0;
  private rpcPromises: Map<number, any> = new Map();
  private ready = false;
  private bg: Background;

  constructor(bg: Background) {
    super();
    this.bg = bg;
    this.init();
  }

  async handleRuntimeMessage(
    message: any,
    sender: browser.runtime.MessageSender
  ): Promise<any> {
    const { debug } = this.logScope("handleRuntimeMessage");
    debug(`message for ${this.name} received`, message);
    if (!this.ready) {
      debug("port not ready, waiting 5s");
      // port not ready yet, give it 5s to change its mind
      await new Promise(resolve => setTimeout(resolve, 5 * 1000));

      if (!this.ready) {
        debug("port not reachable, probably not installed");
        return null;
      }
    }

    switch (message.type) {
      case "seshat":
        if (message.method === "supportsEventIndexing") {
          return true;
        }

        message.eventStore = `webext-${this.bg.runtimeURL.hostname}-${
          this.bg.browserType === "firefox"
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              sender.tab!.cookieStoreId!
            : "default"
        }`;
        break;
    }

    return this.postPortMessage(message);
  }

  private init(): void {
    this.port = browser.runtime.connectNative(this.name);
    this.port.onDisconnect.addListener(this.handleDisconnect.bind(this));
    this.port.onMessage.addListener(this.handlePortMessage.bind(this));
  }

  private close(): void {
    this.ready = false;
    this.port?.onDisconnect.removeListener(this.handleDisconnect.bind(this));
    this.port?.onMessage.removeListener(this.handlePortMessage.bind(this));
    delete this.port;
  }

  private postPortMessage(message: any): Promise<void> {
    const { debug } = this.logScope("postMessage");
    return new Promise((resolve, reject) => {
      this.rpcId++;
      // eslint-disable-next-line @typescript-eslint/camelcase
      message.rpcId = this.rpcId;
      this.rpcPromises.set(this.rpcId, {
        message,
        resolve,
        reject,
      });
      debug(`posting to ${this.name}`, message);
      this.port?.postMessage(message);
    });
  }

  private handlePortMessage(message: any): void {
    const { debug } = this.logScope("handleMessage");
    if (message.ready) {
      debug("port ready");
      this.ready = true;
      return;
    }

    const rpcPromise = this.rpcPromises.get(message.rpcId);
    if (!rpcPromise) {
      debug("port message received without matching rpcPromise", message);
      return;
    }

    if (!message.error) {
      debug("port message received", {
        message,
        origExternalMessage: rpcPromise.message,
      });
      rpcPromise.resolve(message.reply);
    } else {
      console.error("port error received", {
        error: message.error,
        origExternalMessage: rpcPromise.message,
      });
      rpcPromise.reject(new Error(message.error));
    }
    this.rpcPromises.delete(message.rpcId);
  }

  private handleDisconnect(port: browser.runtime.Port): void {
    const { debug } = this.logScope("handleDisconnect");
    debug("port disconnected", port);
    this.close();

    if (port.error) {
      // handle error
      // TODO error.message.includes("No such native application")
    }

    // TODO should get replaced with a button in the UI to retry,
    // to prevent spamming port connection tries
    debug("retrying port connection in 60s");
    setTimeout(() => {
      if (!this.ready) {
        this.init();
      }
    }, 60 * 1000);
  }
}
