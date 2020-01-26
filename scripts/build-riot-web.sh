#!/bin/bash

rm -rf riot-web

git submodule init
git submodule update

cd riot-web
./scripts/fetch-develop.deps.sh --depth 1
yarn install
yarn build