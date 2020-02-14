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

import { Logger } from "../log";
import { Message, MessageResponse } from "../types.js";
import { Config } from "./config";
import { Update } from "./update";
import { SSO } from "./sso";
import { Seshat } from "./seshat";

export class Background extends Logger {
  public webappPath = "/riot/index.html";
  public manifest = browser.runtime.getManifest();
  public version = this.manifest.version;
  public browserType = this.manifest.applications?.gecko ? "firefox" : "chrome";
  public runtimeURL = new URL(browser.runtime.getURL("/"));

  public config = new Config(this);
  public update = new Update(this);
  public sso = new SSO(this);
  public seshat = new Seshat(this);

  constructor() {
    super();
    // listeners must be set up sync
    // TODO: move into persistent event handler wrapper
    this.logScope("constructor").debug("Browser:", this.browserType);
    browser.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    browser.runtime.onUpdateAvailable.addListener(
      this.update.handleUpdateAvailable.bind(this.update)
    );
    browser.browserAction.onClicked.addListener(this.createTab.bind(this));
  }

  initialize(): this {
    this.logScope("initialize").debug("Initializing");
    browser.storage.local.set({ version: this.version });
    this.update.maybeUpdated();
    return this;
  }

  async handleInstalled(details: {
    reason: browser.runtime.OnInstalledReason;
    temporary: boolean;
  }): Promise<browser.tabs.Tab | undefined> {
    const { debug } = this.logScope("handleInstalled");
    debug("onInstalled", details);
    switch (details.reason) {
      case "install":
        debug("First install, opening Riot tab");
        return this.createTab();

      // istanbul ignore next
      case "update":
        if (details.temporary) {
          return this.createTab();
        }
    }
  }

  async handleMessage(
    message: Message,
    sender: browser.runtime.MessageSender
  ): MessageResponse {
    const log = this.logScope("handleMessage");
    log.debug("Incoming message", message);
    if (!sender?.tab?.id) {
      throw new Error("handleMessage: missing sender tab");
    }

    switch (message.type) {
      case "version":
        return this.version;

      case "installUpdate":
        return this.update.installUpdate();

      case "activeTab":
        return this.update.activeTab({
          tabId: message.tabId,
          hash: message.hash,
        });

      case "config":
        return this.config.get();

      case "ssoLogin":
        return this.sso.handleLogin(
          message.url,
          message.responsePattern,
          sender.tab.id
        );

      case "seshat":
        return this.seshat.handleMessage(message, sender);
    }
  }

  async createTab(): Promise<browser.tabs.Tab> {
    const { debug } = this.logScope("createTab");
    debug("Creating riot tab");
    return browser.tabs.create({
      url: this.webappPath,
    });
  }
}
