#!/bin/bash

set -ex

export FIREFOX_EXTENSION_URL="https://addons.mozilla.org/firefox/downloads/file/3493665/riot-latest-fx.xpi"
export CHROME_EXTENSION_URL="https://clients2.google.com/service/update2/crx?response=redirect&prodversion=49.0&x=id%3Dlgpdpggoahhnlmaiompkgghldllldcjh%26installsource%3Dondemand%26uc"

if [[ -n $1 ]]; then
  exec "$@"
fi

build () {
  echo "Building $1"
  rm -rf $1
  mkdir $1
  cd $1

  wget $2 -O $1-extension.zip
  unzip $1-extension.zip -d $1-extension || true
  EXTENSION_VERSION="v$(jq -r '.version' $1-extension/manifest.json)"
  echo "$1 extension version: $EXTENSION_VERSION"

  git clone https://github.com/stoically/riot-webext
  cd riot-webext
  echo $EXTENSION_VERSION | xargs git checkout

  npm install
  npm run build

  echo "Diffing $1"
  diff build/$1 ../$1-extension -u -r --exclude=_metadata --exclude=manifest.json --exclude=META-INF

  cd ../..
}

build "firefox" $FIREFOX_EXTENSION_URL
build "chrome" $CHROME_EXTENSION_URL
