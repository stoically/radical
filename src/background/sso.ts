import { Logger } from "~/log";
import { webRequestOnHeadersReceivedCallbackDetails } from "~/types-browser";
import { Background } from "~/background";

type SsoResponseListener = (
  details: webRequestOnHeadersReceivedCallbackDetails
) => Promise<browser.webRequest.BlockingResponse>;

export class SSO extends Logger {
  private bg: Background;

  constructor(bg: Background) {
    super();
    this.bg = bg;
  }

  async handleLogin(
    url: string,
    responsePattern: string,
    tabId: number
  ): Promise<void> {
    const { debug } = this.logger("handleSsoLogin");
    debug(url, responsePattern);

    browser.webRequest.onHeadersReceived.addListener(
      this.createResponseListener(tabId),
      { urls: [responsePattern] },
      ["responseHeaders"]
    );

    debug("redirecting tab", tabId, url);
    await browser.tabs.update(tabId, { url });
  }

  createResponseListener(tabId: number): SsoResponseListener {
    let listenerTimeout: false | NodeJS.Timeout = false;
    const listener: SsoResponseListener = async (
      details: webRequestOnHeadersReceivedCallbackDetails
    ) => {
      const { debug } = this.logger("ssoResponseListener");
      debug("incoming", details.url);

      if (!listenerTimeout) {
        listenerTimeout = setTimeout(() => {
          // remove listener after an hour in case the sso flow is interrupted
          browser.webRequest.onHeadersReceived.removeListener(listener);
          debug("sso timed out");
        }, 60 * 60 * 1000);
        debug("registered 1h timeout");
      }

      const location = details.responseHeaders?.find(
        responseHeader => responseHeader.name.toLowerCase() === "location"
      );
      if (!location?.value) {
        debug("no location header");
        return {};
      }

      const url = new URL(location.value);
      debug("location header found", url.origin);
      if (!browser.runtime.getURL("/").startsWith(url.origin)) {
        debug("location does not point to the extension, ignoring");
        return {};
      }

      debug("location points to the extension, redirecting tab", tabId);
      browser.webRequest.onHeadersReceived.removeListener(listener);
      clearTimeout(listenerTimeout);
      await browser.tabs.update(tabId, { url: location.value });
      return {};
    };

    return listener;
  }
}
