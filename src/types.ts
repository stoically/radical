import { BrowserFake } from "webextensions-api-fake";

export type RiotConfig = { [key: string]: string | boolean };

export interface MessageVersion {
  method: "version";
}

export interface MessageInstallUpdate {
  method: "installUpdate";
}

export interface MessageActiveTab {
  method: "activeTab";
  tabId: number;
  hash: string;
}

export interface MessageConfig {
  method: "config";
}

export interface MessageSsoLogin {
  method: "ssoLogin";
  url: string;
  responsePattern: string;
}

export type Message =
  | MessageVersion
  | MessageInstallUpdate
  | MessageActiveTab
  | MessageConfig
  | MessageSsoLogin;

export type MessageVersionResponse = string;
export type MessageConfigResponse = RiotConfig;

export type MessageResponse = Promise<
  MessageVersionResponse | MessageConfigResponse | void
>;

export type BrowserType = typeof browser | BrowserFake;
