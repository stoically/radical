export const initialize = async (): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/camelcase
  window.vector_indexeddb_worker_script = "bundles/webext/indexeddb-worker.js";

  switch (typeof browser) {
    case "undefined":
      // Chrome does not allow executing scripts in the same context, so the
      // additional sandboxing into a content script unfortunately is not
      // possible yet
      await Promise.all(
        [
          "/browser-polyfill.min.js",
          "bundles/webext/vendor.js",
          "bundles/webext/bundle.js"
        ].map(
          scriptSrc =>
            new Promise(resolve => {
              const script = document.createElement("script");
              script.src = scriptSrc;
              script.async = true;
              script.onload = resolve;
              document.body.append(script);
            })
        )
      );
      break;

    case "object":
      // Firefox does allow sandboxing into a content script
      const tab = await browser.tabs.getCurrent();
      if (!tab?.id) {
        return;
      }

      await browser.tabs.executeScript(tab.id, {
        file: "bundles/webext/vendor.js"
      });

      await browser.tabs.executeScript(tab.id, {
        file: "bundles/webext/bundle.js"
      });
      break;
  }

  browser.runtime.onMessage.addListener(message => {
    console.log("[WebExtension Initializer] Incoming message", message);

    switch (message.method) {
      case "activeTabs":
        (async (): Promise<void> => {
          const tab = await browser.tabs.getCurrent();
          if (!tab) {
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
};

if (typeof browser !== "undefined" || typeof chrome !== "undefined") {
  initialize();
}
