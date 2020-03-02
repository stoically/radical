#!/bin/bash

set -e

echo -n "release|rebase? "
read RELEASE

if [[ $RELEASE != "release" && $RELEASE != "rebase" ]]; then
  echo "must be either \"release\" or \"rebase\""
  exit 1
fi

if [[ $RELEASE = "release" ]]; then
  echo -n "target version (without leading \"v\")? "
  read VERSION

  if [[ -z "$VERSION" ]]; then
    echo "version can't be empty"
    exit 1
  fi
  if [[ ${VERSION::1} = "v" ]]; then
    echo "version can not start with \"v\""
    exit 1
  fi
  VERSION_TAG="v$VERSION"
fi

if [[ $RELEASE = "release" ]]; then
  MANIFEST_VERSION=$(jq -r '.version' src/manifest.firefox.json)
  if [[ "$MANIFEST_VERSION" != "$VERSION" ]]; then
    echo "given version does not match manifest version"
    exit 1
  fi
fi

echo -n "rebase on which riot web version tag"
if [[ $RELEASE = "release" ]]; then
  echo -n " (leaving empty uses release version)"
fi
echo -n "? "
read RIOT_WEB_VERSION_TAG
if [[ -z $RIOT_WEB_VERSION_TAG ]]; then
  if [[ $RELEASE = "release" ]]; then
    RIOT_WEB_VERSION_TAG="$VERSION_TAG"
  else
    echo "version can not be empty"
  fi
fi
if [[ $RIOT_WEB_VERSION_TAG = "develop" ]]; then
  RIOT_WEB_VERSION_TAG="upstream/develop"
fi

if [[ $RELEASE = "release" ]]; then
  echo "release version: ${VERSION}"
fi
echo "rebasing riot-web on tag: $RIOT_WEB_VERSION_TAG"
echo -n "proceed? [yN] "
read proceed

if [[ $proceed != "y" && $proceed != "Y" ]]; then
  echo "aborting"
  exit 1
fi

which jq || sudo apt install jq
git submodule init
git submodule update


cd riot-web
git remote set-url origin git@github.com:stoically/riot-web.git
git remote add upstream https://github.com/vector-im/riot-web.git || true
git fetch upstream
git checkout webext-develop
PATCH_COMMIT=$(git rev-parse webext-develop)
echo "riot-web patch commit: $PATCH_COMMIT"
git reset --hard $RIOT_WEB_VERSION_TAG
git cherry-pick -S $PATCH_COMMIT
if [[ $RELEASE = "release" ]]; then
  git push --force
  git tag webext-$VERSION_TAG
  git push origin webext-$VERSION_TAG
fi
cd ..

if [[ $RIOT_WEB_VERSION_TAG != "upstream/develop" ]]; then
  REACT_SDK_VERSION_TAG="v$(jq -r '.dependencies."matrix-react-sdk"' riot-web/package.json)"
else
  REACT_SDK_VERSION_TAG="upstream/develop"
fi
cd matrix-react-sdk
git remote set-url origin git@github.com:stoically/matrix-react-sdk.git
git remote add upstream https://github.com/matrix-org/matrix-react-sdk.git || true
git fetch upstream
git checkout webext-develop
PATCH_COMMIT=$(git rev-parse webext-develop)
echo "matrix-react-sdk patch commit: $PATCH_COMMIT"
git reset --hard $REACT_SDK_VERSION_TAG
git cherry-pick -S $PATCH_COMMIT
if [[ $RELEASE = "release" ]]; then
  git push --force
  git tag webext-$VERSION_TAG
  git push origin webext-$VERSION_TAG
fi
cd ..

if [[ $RIOT_WEB_VERSION_TAG != "upstream/develop" ]]; then
  JS_SDK_VERSION_TAG="v$(jq -r '.dependencies."matrix-js-sdk"' riot-web/package.json)"
else
  JS_SDK_VERSION_TAG="develop"
fi
cd matrix-js-sdk
git fetch
git checkout $JS_SDK_VERSION_TAG
cd ..

if [[ $RELEASE = "release" ]]; then
  git add riot-web matrix-* src/manifest.*
  git commit -S -m "chore(release): $VERSION_TAG"
  git push
  git tag $VERSION_TAG
  git push origin $VERSION_TAG
  echo "Release successfully"
else
  echo "Rebased successfully"
fi