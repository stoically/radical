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

import { BrowserFake } from "webextensions-api-fake";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RiotConfig = { [key: string]: any };

export interface MessageVersion {
  type: "version";
}

export interface MessageInstallUpdate {
  type: "installUpdate";
}

export interface MessageActiveTab {
  type: "activeTab";
  tabId: number;
  hash: string;
}

export interface MessageConfig {
  type: "config";
}

export interface MessageSsoLogin {
  type: "ssoLogin";
  url: string;
  responsePattern: string;
}

export interface MessageSeshat {
  type: "seshat";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
}

export type Message =
  | MessageVersion
  | MessageInstallUpdate
  | MessageActiveTab
  | MessageConfig
  | MessageSsoLogin
  | MessageSeshat;

export type MessageVersionResponse = string;
export type MessageConfigResponse = RiotConfig;

export type MessageResponse = Promise<
  MessageVersionResponse | MessageConfigResponse | boolean | void
>;

export type BrowserType = typeof browser | BrowserFake;
