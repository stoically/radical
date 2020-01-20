#!/bin/bash

set -ex

rm -rf build riot-web
yarn install

mkdir build
cp -r src build/firefox
cp -r src build/chrome

git submodule init
git submodule update

cd riot-web
./scripts/fetch-develop.deps.sh --depth 1
yarn install
cp config.sample.json config.json
yarn build
#git rev-parse HEAD > webapp/version

cd ..

cp -r riot-web/webapp build/firefox/riot
cp manifest.firefox.json build/firefox/manifest.json

cp -r riot-web/webapp build/chrome/riot
rm build/chrome/riot/manifest.json
cp manifest.chrome.json build/chrome/manifest.json
cp node_modules/webextension-polyfill/dist/browser-polyfill.min.js build/chrome