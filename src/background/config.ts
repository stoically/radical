// Copyright 2020 stoically@protonmail.com
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable @typescript-eslint/camelcase */
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
      }
    );
  }
}
