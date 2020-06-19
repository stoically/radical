import { RiotConfig } from "~/types";

export class Config {
  async get(): Promise<RiotConfig> {
    const { riotConfigDefault } = await browser.storage.local.get([
      "riotConfigDefault",
    ]);

    return (
      riotConfigDefault || {
        default_server_config: {
          "m.homeserver": {
            base_url: "https://matrix-client.matrix.org",
            server_name: "matrix.org",
          },
          "m.identity_server": {
            base_url: "https://vector.im",
          },
        },
        enable_presence_by_hs_url: {
          "https://matrix.org": false,
          "https://matrix-client.matrix.org": false,
          "https://mozilla.modular.im": false,
        },
      }
    );
  }
}
