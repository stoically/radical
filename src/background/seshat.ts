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
