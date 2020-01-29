// https://github.com/jsmnbom/definitelytyped-firefox-webext-browser
//
// MIT License

// Copyright (c) 2018 Jasmin Bom

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// should use types directly from firefox-webext-browser once that's possible
// https://github.com/jsmnbom/definitelytyped-firefox-webext-browser/issues/31

export type webRequestOnHeadersReceivedCallbackDetails = {
  /**
   * The ID of the request. Request IDs are unique within a browser session. As a result, they could be used to
   * relate different events of the same request.
   */
  requestId: string;
  url: string;
  /** Standard HTTP method. */
  method: string;
  /**
   * The value 0 indicates that the request happens in the main frame; a positive value indicates the ID of a
   * subframe in which the request happens. If the document of a (sub-)frame is loaded (`type` is `main_frame` or
   * `sub_frame`), `frameId` indicates the ID of this frame, not the ID of the outer frame. Frame IDs are unique
   * within a tab.
   */
  frameId: number;
  /** ID of frame that wraps the frame which sent the request. Set to -1 if no parent frame exists. */
  parentFrameId: number;
  /** True for private browsing requests. */
  incognito?: boolean;
  /** The cookie store ID of the contextual identity. */
  cookieStoreId?: string;
  /** URL of the resource that triggered this request. */
  originUrl?: string;
  /** URL of the page into which the requested resource will be loaded. */
  documentUrl?: string;
  /** The ID of the tab in which the request takes place. Set to -1 if the request isn't related to a tab. */
  tabId: number;
  /** How the requested resource will be used. */
  type: browser.webRequest.ResourceType;
  /** The time when this signal is triggered, in milliseconds since the epoch. */
  timeStamp: number;
  /**
   * HTTP status line of the response or the 'HTTP/0.9 200 OK' string for HTTP/0.9 responses (i.e., responses
   * that lack a status line).
   */
  statusLine: string;
  /** The HTTP response headers that have been received with this response. */
  responseHeaders?: browser.webRequest.HttpHeaders;
  /** Standard HTTP status code returned by the server. */
  statusCode: number;
  /** Tracking classification if the request has been classified. */
  urlClassification?: browser.webRequest.UrlClassification;
};
