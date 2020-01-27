/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
(async (): Promise<void> => {
  switch (typeof browser) {
    case "undefined":
      // Chrome does not allow executing scripts in the same context, so the
      // additional sandboxing into a content script unfortunately is not
      // possible yet
      window.vector_indexeddb_worker_script =
        "bundles/webext/indexeddb-worker.js";

      ["vendor.js", "bundle.js"].map(scriptName => {
        const script = document.createElement("script");
        script.src = `bundles/webext/${scriptName}`;
        script.async = true;
        document.body.append(script);
      });
      break;

    case "object":
      // Firefox does allow sandboxing into a content script
      const tab = await browser.tabs.getCurrent();
      browser.tabs.executeScript(tab!.id!, {
        code:
          "window.vector_indexeddb_worker_script = 'bundles/webext/indexeddb-worker.js'"
      });
      browser.tabs.executeScript(tab!.id!, {
        file: "bundles/webext/vendor.js"
      });
      browser.tabs.executeScript(tab!.id!, {
        file: "bundles/webext/bundle.js"
      });
      break;
  }
})();
