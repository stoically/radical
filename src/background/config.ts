import riotConfigBundled from "~/../riot-web/config.sample.json";
import { Background } from "~/background/lib";
import { RiotConfig } from "~/types";

export class Config {
  private bg: Background;

  constructor(bg: Background) {
    this.bg = bg;
  }

  async get(): Promise<RiotConfig> {
    const { riotConfigDefault } = await browser.storage.local.get([
      "riotConfigDefault",
    ]);

    const config = riotConfigDefault || riotConfigBundled;

    // due to remote code execution limitations in AMO policies we
    // force-deactivate piwik
    if (this.bg.browserType === "firefox") {
      config.piwik = false;
    }

    return config;
  }
}
