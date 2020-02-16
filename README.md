# Radical

![Build Status](https://github.com/stoically/radical/workflows/build/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/stoically/radical/badge.svg?branch=master)](https://coveralls.io/github/stoically/radical?branch=master)
[![Riot Web Version](https://img.shields.io/badge/Riot%20Web%20Version-1.5.8-success)](https://github.com/vector-im/riot-web/releases)

[Riot Web](https://github.com/vector-im/riot-web) bundled as Firefox Add-on.

- Firefox AMO: https://addons.mozilla.org/firefox/addon/radical-web
- Matrix Room: [#radical-webext:matrix.org](https://matrix.to/#/#radical-webext:matrix.org)

## Features

- Riot Web served entirely locally without the need for additional setup
- Ability to edit Riot Web's "config.json" in the Add-on preferences
- Search in encrypted rooms using [Radical Native](https://github.com/stoically/radical-native#readme)

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
npm install
npm run build
npm run dist
```

## Disclaimer

Not an official project from [New Vector](https://vector.im/)!
