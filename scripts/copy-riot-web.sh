#!/bin/bash

set -ex
pwd

[[ -d riot-web/webapp ]] || exit 1

mkdir -p build
mkdir -p build/firefox
cp -r riot-web/webapp build/firefox/riot
mkdir -p build/chrome
cp -r riot-web/webapp build/chrome/riot
