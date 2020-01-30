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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MessageResponse = Promise<any>;
