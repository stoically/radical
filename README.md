# Riot WebExtension

[Riot Web](https://github.com/vector-im/riot-web) bundled as WebExtension.

- Firefox AMO: https://addons.mozilla.org/firefox/addon/riot/
- Chrome Store: https://chrome.google.com/webstore/detail/lgpdpggoahhnlmaiompkgghldllldcjh
- Matrix Room: [#riot-webext:matrix.org](https://matrix.to/#/#riot-webext:matrix)

It's planned to hopefully get WebExtensions support upstreamed at some point.

## Features

- Riot Web served entirely locally without the need for additional setup
- Guaranteed Riot Web source files with reduced MITM attack vector

## Security

Riot Web [requires the use of `unsafe-eval`](https://github.com/vector-im/riot-web/issues/3632), so until that changes it's required for the
WebExtension as well, but since the WebExtension doesn't require any [host permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions#Host_permissions) it can generally be considered secure. The Riot WebExtension runs as [options page](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/options_ui).


### Verify sources

This doesn't work yet since riot-webext depends on a [riot-web fork](https://github.com/stoically/riot-web). It'll be possible if the project gets upstreamed.

<details>
<summary>Instructions</summary>

-   Download [matching release from riot-web](https://github.com/vector-im/riot-web/releases) and extract its content into a folder named `riot-web` using `tar xzf`
-   Download the Add-on itself and extract its content into a folder named `riot-webext` using `unzip`
-   Compare the sha256sums by running `[[ $(cd riot-web && find . -type f \( -exec sha256sum {} \; \) | sha256sum) == $(cd riot-webext/riot && find . -type f \( -exec sha256sum {} \; \) | sha256sum) ]] && echo "OK" || echo "sha256sums do not match!"`
-   Responds with `OK` if the sha256sums match

</details>

## Development

```shell
npm install
npm run test:watch
```

## Disclaimer

Not an official project from [New Vector](https://vector.im/)!

Usage of the Riot icon is [officially permitted](https://matrix.to/#/!xYvNcQPhnkrdUmYczI:matrix.org/$lvRXRVIzCrv7RtFLYQmW5eAqImYQvMHDach_Rr1c6Hg?via=matrix.org&via=feneas.org&via=kde.org).