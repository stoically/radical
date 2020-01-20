# Riot WebExtension

Simply [riot-web](https://github.com/vector-im/riot-web) bundled as WebExtension.

- Firefox AMO: https://addons.mozilla.org/firefox/addon/riot/
- Chrome Store: In Review
- Matrix Room: [#riot-webext:matrix.org](https://matrix.to/#/#riot-webext:matrix)

## Features

- Riot Web served entirely locally without the need for additional setup
- Guaranteed Riot Web source files without MITM attack vector
- WebExtension doesn't require any permissions

## Security

The Riot WebExtension runs inside of an extension page, which are treated as
[content
scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts).
Content scripts can only access [a small subset of the WebExtension
APIs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#WebExtension_APIs).
The Riot WebExtension [background
script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Anatomy_of_a_WebExtension#Background_scripts)
doesn't expose any functionality to the content script.

Riot Web [requires the use of `unsafe-eval`](https://github.com/vector-im/riot-web/issues/3632), so it's required for the
WebExtension as well until that changes, but since the WebExtension runs as content script, doesn't
expose functionality over the background script and doesn't require any
[permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions),
it can be considered the same level of secure as Riot Web hosted over regular
HTTPS.

### Verify sources

This doesn't work yet since riot-webext needs to depend on a [fork of riot-web develop](https://github.com/stoically/riot-web/tree/webpack-split-vendors). It'll work once riot-webext can depend on stable riot-web, if the [required patch](https://github.com/vector-im/riot-web/pull/11973) gets merged upstream.

<details>
<summary>Instructions</summary>

- Download [matching release from riot-web](https://github.com/vector-im/riot-web/releases) and extract its content into a folder named `riot-web` using `tar xzf`
- Download the Add-on itself and extract its content into a folder named `riot-webext` using `unzip`
- Compare the sha256sums by running `[[ $(cd riot-web && find . -type f \( -exec sha256sum {} \; \) | sha256sum) == $(cd riot-webext/riot && find . -type f \( -exec sha256sum {} \; \) | sha256sum) ]] && echo "OK" || echo "sha256sums do not match!"`
- Responds with `OK` if the sha256sums match

</details>

## Development

### Build

yarn is required because it's a hard riot-web build dependency.

```
yarn build
```
