# Radical

![Build Status](https://github.com/stoically/radical/workflows/build/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/stoically/radical/badge.svg?branch=master)](https://coveralls.io/github/stoically/radical?branch=master)
[![Radical Matrix room #radical-webext:matrix.org](https://img.shields.io/matrix/radical-webext:matrix.org.svg?label=%23radical-webext:matrix.org&logo=matrix&server_fqdn=matrix.org)](https://matrix.to/#/#radical-webext:matrix.org)

[Riot Web](https://github.com/vector-im/riot-web) bundled as Firefox Add-on.

- Firefox AMO: https://addons.mozilla.org/firefox/addon/radical-web

## Features

- Riot Web served entirely locally without the need for additional setup
- Ability to edit Riot Web's "config.json" in the Add-on preferences
- Search in encrypted rooms using [Radical Native](https://github.com/stoically/radical-native#readme)

### Search

1. Install [Radical Native](https://github.com/stoically/radical-native#install)
2. Configure the Riot Web config in the Radical Add-on preferences to include

  ```
    "features": {
      "feature_event_indexing": "enable"
    }
  ```

3. Reload Riot Add-on tab, go to "Settings > Security & Privacy", there you should see a "Manage" button under "Message search", clicking it should show [ongoing work](https://github.com/vector-im/riot-web/issues/12334)

#### Troubleshooting

- See https://github.com/stoically/radical-native#troubleshooting
- Try restarting Firefox with both Add-ons installed and enabled


## Development

[yarn](https://yarnpkg.com/) is required to build riot-web.

```shell
npm install
npm run dev
```

### Firefox

- Load the build located in `build/firefox` as Temporary Add-on via
  `about:debugging#/runtime/this-firefox`

## Tests

```shell
# watcher
npm run test:watch

# once & coverage
npm run test
```

## Release

```shell
# bump version in manifest.json
./scripts/release.sh <version> [riot-web-version-tag]
```

## Disclaimer

Not an official project from [New Vector](https://vector.im/)!
