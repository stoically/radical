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
  | MessageSeshat;

export type MessageVersionResponse = string;
export type MessageConfigResponse = RiotConfig;

export type MessageResponse = Promise<
  MessageVersionResponse | MessageConfigResponse | boolean | void
>;

export type BrowserType = typeof browser | BrowserFake;
