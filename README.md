# Riot WebExtension

[Riot Web](https://github.com/vector-im/riot-web) bundled as WebExtension.

- Firefox AMO: https://addons.mozilla.org/firefox/addon/riot/
- Chrome Store: https://chrome.google.com/webstore/detail/lgpdpggoahhnlmaiompkgghldllldcjh
- Matrix Room: [#riot-webext:matrix.org](https://matrix.to/#/#riot-webext:matrix)

It's planned to hopefully get WebExtensions support merged upstream at some point.

## Features

- Riot Web served entirely locally without the need for additional setup
- Guaranteed Riot Web source files with reduced MITM attack vector
- Ability to edit Riot Web's "config.json" in the Add-on preferences

## Security

The Riot WebExtension doesn't require any [host permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions#Host_permissions) and runs as [extension page](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Extension_pages) with access to only a small subset of the WebExtensions API.


### Verify sources

This doesn't work yet since riot-webext depends on a [riot-web fork](https://github.com/stoically/riot-web). It'll be possible if the fork gets merged upstream.

<details>
<summary>Instructions</summary>

-   Download [matching release from riot-web](https://github.com/vector-im/riot-web/releases) and extract its content into a folder named `riot-web` using `tar xzf`
-   Download the Add-on itself and extract its content into a folder named `riot-webext` using `unzip`
-   Compare the sha256sums by running `[[ $(cd riot-web && find . -type f \( -exec sha256sum {} \; \) | sha256sum) == $(cd riot-webext/riot && find . -type f \( -exec sha256sum {} \; \) | sha256sum) ]] && echo "OK" || echo "sha256sums do not match!"`
-   Responds with `OK` if the sha256sums match

</details>

## Development

yarn is required to build riot-web.

```shell
npm install
npm run riot-web:install
npm run dev
```

### Firefox

- Load the build located in `build/firefox` as Temporary Add-on via
  `about:debugging#/runtime/this-firefox`

### Chrome

- Load the build located in `build/chrome` as Unpacked extension via `chrome://extensions/`

## Tests

```shell
# watcher
npm run test:watch

# once & coverage
npm run test
```

## Release

```shell
npm install
npm run build
npm run dist
```

## Disclaimer

Not an official project from [New Vector](https://vector.im/)!

Usage of the Riot icon is [officially permitted](https://matrix.to/#/!xYvNcQPhnkrdUmYczI:matrix.org/$lvRXRVIzCrv7RtFLYQmW5eAqImYQvMHDach_Rr1c6Hg?via=matrix.org&via=feneas.org&via=kde.org).