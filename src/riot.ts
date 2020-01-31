/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { injectScript } from "./utils";
import { Logger } from "./log";
const logger = new Logger();
const log = logger.logger("[WebExtension Initializer]");

declare global {
  interface Window {
    vector_indexeddb_worker_script: string;
  }
}

export const listener = (browser: any): void => {
  // listener for messages from background
  browser.runtime.onMessage.addListener((message: any) => {
    log.debug("[WebExtension Initializer] Incoming message", message);

    switch (message.method) {
      case "activeTabs":
        (async (): Promise<void> => {
          const tab = await browser.tabs.getCurrent();
          if (!tab) {
            log.debug("[WebExtension Initializer] could not getCurrent() tab");
            return;
          }
          log.debug("[WebExtension Initializer] Current tab", tab);

          browser.runtime.sendMessage({
            method: "activeTab",
            tabId: tab.id,
            hash: window.location.hash,
          });
        })();
        break;
    }

    // always return false or we might handle message meant for background
    return false;
  });
};

export const sanitize = (): void => {
  // remove all browser APIs that aren't needed here or in riot's WebExtensionPlatform
  // @ts-ignore
  browser = {
    runtime: {
      sendMessage: browser.runtime.sendMessage,
      onMessage: browser.runtime.onMessage,
    },
    tabs: {
      getCurrent: browser.tabs.getCurrent,
    },
    permissions: {
      request: browser.permissions.request,
    },
  };
  // @ts-ignore
  chrome = null;
};

export const run = async (): Promise<void> => {
  // run riot
  // eslint-disable-next-line @typescript-eslint/camelcase
  window.vector_indexeddb_worker_script = "bundles/webext/indexeddb-worker.js";
  await Promise.all(
    ["bundles/webext/vendor.js", "bundles/webext/bundle.js"].map(injectScript)
  );
};

export const initialize = async (): Promise<void> => {
  if (typeof browser === "undefined") {
    await injectScript("/browser-polyfill.min.js");
  }

  sanitize();
  listener(browser);
  return run();
};

if (typeof window !== "undefined") {
  initialize();
}
