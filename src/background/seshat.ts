export class Seshat {
  private riotNativeReady = true;

  async handleMessage(message: any): Promise<any> {
    switch (message.method) {
      case "supportsEventIndexing":
        return this.riotNativeReady;

      default:
        return browser.runtime.sendMessage("@riot-booster-pack", message);
    }
  }
}
