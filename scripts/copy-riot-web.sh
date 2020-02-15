#!/bin/bash

set -ex
pwd

[[ -d riot-web/webapp ]] || exit 1

mkdir -p build
mkdir -p build/firefox/riot
cp -r riot-web/webapp/* build/firefox/riot