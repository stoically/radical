/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { injectScript } from "./utils";

export const initialize = async (browserFake?: any): Promise<void> => {
  if (browserFake) {
    // @ts-ignore
    browser = browserFake;
  }

  if (typeof browser === "undefined") {
    await injectScript("/browser-polyfill.min.js");
  }

  // remove all browser APIs that aren't needed here or in riot's WebExtensionPlatform
  // @ts-ignore
  browser = {
    runtime: {
      sendMessage: browser.runtime.sendMessage,
      onMessage: browser.runtime.onMessage
    },
    tabs: {
      getCurrent: browser.tabs.getCurrent
    }
  };
  // @ts-ignore
  chrome = null;

  // listener for messages from background
  browser.runtime.onMessage.addListener((message: any) => {
    console.log("[WebExtension Initializer] Incoming message", message);

    switch (message.method) {
      case "activeTabs":
        (async (): Promise<void> => {
          const tab = await browser.tabs.getCurrent();
          if (!tab) {
            console.error(
              "[WebExtension Initializer] could not getCurrent() tab"
            );
            return;
          }
          console.log("[WebExtension Initializer] Current tab", tab);

          browser.runtime.sendMessage({
            method: "activeTab",
            tabId: tab.id,
            hash: window.location.hash
          });
        })();
        break;
    }

    // always return false or we might handle message meant for background
    return false;
  });

  // run riot
  // eslint-disable-next-line @typescript-eslint/camelcase
  window.vector_indexeddb_worker_script = "bundles/webext/indexeddb-worker.js";
  await Promise.all(
    ["bundles/webext/vendor.js", "bundles/webext/bundle.js"].map(injectScript)
  );
};

if (!window.__riot_test__) {
  initialize();
}
