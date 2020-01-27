#!/bin/bash

set -ex

# firefox
mkdir -p build/firefox
cp src/manifest.firefox.json build/firefox/manifest.json
cp -r src/vector-icons build/firefox
cp LICENSE build/firefox
mkdir -p build/firefox/vendor/jsoneditor
cp node_modules/jsoneditor/dist/jsoneditor.min.css build/firefox/vendor/jsoneditor
cp -r node_modules/jsoneditor/dist/img build/firefox/vendor/jsoneditor

# chrome
mkdir -p build/chrome
cp src/manifest.chrome.json build/chrome/manifest.json
cp -r src/vector-icons build/chrome
cp LICENSE build/chrome
cp node_modules/webextension-polyfill/dist/browser-polyfill.min.js build/chrome
rm -f build/chrome/riot/manifest.json
mkdir -p build/chrome/vendor/jsoneditor
cp node_modules/jsoneditor/dist/jsoneditor.min.css build/chrome/vendor/jsoneditor
cp -r node_modules/jsoneditor/dist/img build/chrome/vendor/jsoneditor