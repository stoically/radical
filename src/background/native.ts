import { Logger } from "~/log";

export class NativePort extends Logger {
  private port?: browser.runtime.Port;
  private rpcId = 0;
  private rpcPromises: Map<number, any> = new Map();
  private ready = false;

  constructor() {
    super();
    this.init();
  }

  async handleRuntimeMessage(message: any): Promise<any> {
    const { debug } = this.logScope("handleRuntimeMessage");
    debug("message for radical.native received", message, "ready", this.ready);
    if (!this.ready) return false;

    return this.postPortMessage(message);
  }

  private init(): void {
    this.port = browser.runtime.connectNative("radical.native");
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
      message.rpc_id = this.rpcId;
      this.rpcPromises.set(this.rpcId, {
        message,
        resolve,
        reject,
      });
      debug("posting to radical.native", message);
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

    const rpcPromise = this.rpcPromises.get(message.rpc_id);
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
    this.rpcPromises.delete(message.rpc_id);
  }

  private handleDisconnect(port: browser.runtime.Port): void {
    const { debug } = this.logScope("handleDisconnect");
    debug("port disconnected", port);
    this.close();

    if (port.error) {
      // handle error
    }

    debug("retrying port connection in 60s");
    setTimeout(() => {
      this.init();
    }, 60 * 1000);
  }
}
