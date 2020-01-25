#!/bin/bash

set -ex

# firefox
rm -rf build/firefox
cp -r build/webext build/firefox
cp -r riot-web/webapp build/firefox/riot
cp src/manifest.firefox.json build/firefox/manifest.json
cp -r src/vector-icons build/firefox
cp LICENSE build/firefox

# chrome
rm -rf build/chrome
cp -r build/webext build/chrome
cp -r riot-web/webapp build/chrome/riot
cp src/manifest.chrome.json build/chrome/manifest.json
cp -r src/vector-icons build/chrome
cp LICENSE build/chrome
cp node_modules/webextension-polyfill/dist/browser-polyfill.min.js build/chrome
rm -f build/chrome/riot/manifest.json