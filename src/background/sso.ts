import { Logger } from "~/log";
import { webRequestOnHeadersReceivedCallbackDetails } from "~/types-browser";
import { Background } from "~/background/lib";

type ResponseListener = (
  details: webRequestOnHeadersReceivedCallbackDetails
) => Promise<browser.webRequest.BlockingResponse>;

interface ResponseListenerFactory {
  create: () => ResponseListener;
  timeout?: NodeJS.Timeout;
}

const LISTENER_TIMEOUT_MS = 15 * 60 * 1000;

export class SSO extends Logger {
  async handleLogin(
    url: string,
    responsePattern: string,
    tabId: number
  ): Promise<void> {
    const { debug } = this.logScope("handleSsoLogin");
    debug(url, responsePattern);

    browser.webRequest.onHeadersReceived.addListener(
      this.responseListener(tabId).create(),
      { urls: [responsePattern] },
      ["responseHeaders"]
    );

    debug("redirecting tab", tabId, url);
    await browser.tabs.update(tabId, { url });
  }

  responseListener(tabId: number): ResponseListenerFactory {
    const { debug } = this.logScope("responseListener");
    return {
      create(): ResponseListener {
        const listener = async (
          details: webRequestOnHeadersReceivedCallbackDetails
        ): Promise<browser.webRequest.BlockingResponse> => {
          debug("incoming", details.url);

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
          this.timeout && clearTimeout(this.timeout);
          // TODO: remove permissions
          await browser.tabs.update(tabId, { url: location.value });
          return {};
        };

        this.timeout = setTimeout(() => {
          debug("listener timed out");
          browser.webRequest.onHeadersReceived.removeListener(listener);
          // TODO: remove permissions
        }, LISTENER_TIMEOUT_MS);
        debug("registered listener timeout", LISTENER_TIMEOUT_MS);

        return listener;
      },
    };
  }
}
