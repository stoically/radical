#!/bin/bash

set -ex

VERSION=$1
if [[ -z "$VERSION" ]]; then
  echo "missing version"
  exit 1
fi
if [[ ${VERSION::1} = "v" ]]; then
  echo "version can not start with \"v\""
  exit 1
fi
VERSION_TAG="v$VERSION"

MANIFEST_VERSION=$(jq -r '.version' src/manifest.firefox.json)
if [[ "$MANIFEST_VERSION" != "$VERSION" ]]; then
  echo "given version does not match manifest version"
  exit 1
fi

which jq || sudo apt install jq
git submodule init
git submodule update


echo "releasing $VERSION_TAG"
if [[ -z $2 ]]; then
  RIOT_WEB_VERSION_TAG="$VERSION_TAG"
else
  RIOT_WEB_VERSION_TAG="$2"
fi
if [[ "${RIOT_WEB_VERSION_TAG::1}" != "v" ]]; then
  echo "riot-web version tag must start with \"v\""
  exit 1
fi
echo "rebasing riot-web on tag $RIOT_WEB_VERSION_TAG"

sleep 5

cd riot-web
git remote set-url origin git@github.com:stoically/riot-web.git
git remote add upstream https://github.com/vector-im/riot-web.git || true
git checkout webext-develop
git fetch upstream
git rebase $RIOT_WEB_VERSION_TAG
git commit --amend -S -m "WebExtensions support"
git push --force
git tag webext-$VERSION_TAG
git push origin webext-$VERSION_TAG
cd ..

REACT_SDK_VERSION_TAG="v$(jq -r '.dependencies."matrix-react-sdk"' riot-web/package.json)"
cd matrix-react-sdk
git remote set-url origin git@github.com:stoically/matrix-react-sdk.git
git remote add upstream https://github.com/matrix-org/matrix-react-sdk.git || true
git checkout webext-develop
git fetch upstream
git rebase $REACT_SDK_VERSION_TAG
git commit --amend -S -m "WebExtensions support"
git push --force
git tag webext-$VERSION_TAG
git push origin webext-$VERSION_TAG
cd ..

JS_SDK_VERSION_TAG="v$(jq -r '.dependencies."matrix-js-sdk"' riot-web/package.json)"
cd matrix-js-sdk
git fetch
git checkout $JS_SDK_VERSION_TAG
cd ..

git add riot-web matrix-* src/manifest.*
git commit -S -m "chore(release): $VERSION_TAG"
git push
git tag $VERSION_TAG
git push origin $VERSION_TAG