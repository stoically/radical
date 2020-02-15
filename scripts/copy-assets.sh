#!/bin/bash

set -ex

# firefox
mkdir -p build/firefox
cp src/manifest.firefox.json build/firefox/manifest.json
cp -r src/vector-icons build/firefox
cp LICENSE build/firefox
mkdir -p build/firefox/vendor/jsoneditor
cp node_modules/jsoneditor/dist/jsoneditor.min.* build/firefox/vendor/jsoneditor
cp -r node_modules/jsoneditor/dist/img build/firefox/vendor/jsoneditor
