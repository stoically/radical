import { BrowserFake } from "webextensions-api-fake";

export type RiotConfig = { [key: string]: string | boolean };

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
