#!/bin/bash

set -e

# --- Rebase ---

echo -n "rebase on riot web version tag: "
read RIOT_WEB_VERSION_TAG
if [[ -z $RIOT_WEB_VERSION_TAG ]]; then
  echo "version tag cannot be empty"
  exit 1
fi
if [[ $RIOT_WEB_VERSION_TAG != "develop" ]]; then
  if [[ ${RIOT_WEB_VERSION_TAG::1} != "v" ]]; then
    echo "version tag must start with \"v\""
    exit 1
  fi
  REBASE_VERSION_TAG=$RIOT_WEB_VERSION_TAG
else
  REBASE_VERSION_TAG="upstream/develop"
fi

which jq || sudo apt install jq
git submodule init
git submodule update

cd riot-web
git remote set-url origin git@github.com:stoically/riot-web.git
git remote add upstream https://github.com/vector-im/riot-web.git || true
git fetch upstream --tags
git checkout webext-develop
PATCH_COMMIT=$(git rev-parse webext-develop)
echo "riot-web patch commit: $PATCH_COMMIT"
git reset --hard $REBASE_VERSION_TAG
git cherry-pick -S $PATCH_COMMIT
cd ..


if [[ $REBASE_VERSION_TAG != "upstream/develop" ]]; then
  REACT_SDK_VERSION_TAG="v$(jq -r '.dependencies."matrix-react-sdk"' riot-web/package.json)"
else
  REACT_SDK_VERSION_TAG="upstream/develop"
fi
cd matrix-react-sdk
git remote set-url origin git@github.com:stoically/matrix-react-sdk.git
git remote add upstream https://github.com/matrix-org/matrix-react-sdk.git || true
git fetch upstream --tags
git checkout webext-develop
PATCH_COMMIT=$(git rev-parse webext-develop)
echo "matrix-react-sdk patch commit: $PATCH_COMMIT"
git reset --hard $REACT_SDK_VERSION_TAG
git cherry-pick -S $PATCH_COMMIT
cd ..

if [[ $REBASE_VERSION_TAG != "upstream/develop" ]]; then
  JS_SDK_VERSION_TAG="v$(jq -r '.dependencies."matrix-js-sdk"' riot-web/package.json)"
else
  JS_SDK_VERSION_TAG="origin/develop"
fi
cd matrix-js-sdk
git fetch
git checkout $JS_SDK_VERSION_TAG
cd ..

echo "Rebase successful"

# --- Release ---

echo -n "Continue with release process? [yN] "
read proceed
if [[ $proceed != "y" && $proceed != "Y" ]]; then
  echo "aborting"
  exit 1
fi

echo -n "release version (leave empty to use rebased version): "
read RELEASE_VERSION

if [[ -z "$RELEASE_VERSION" ]]; then
  if [[ $RIOT_WEB_VERSION_TAG = "develop" ]]; then
    echo "cannot release \"develop\""
    exit 1
  fi
  RELEASE_VERSION=${RIOT_WEB_VERSION_TAG:1}
else
  if [[ ${RELEASE_VERSION::1} = "v" ]]; then
    echo "version cannot start with \"v\""
    exit 1
  fi
fi

MANIFEST_VERSION=$(jq -r '.version' src/manifest.json)
if [[ "$MANIFEST_VERSION" != "$RELEASE_VERSION" ]]; then
  echo "given version $RELEASE_VERSION does not match manifest version $MANIFEST_VERSION"
  exit 1
fi

echo "release version: $RELEASE_VERSION"
echo "rebased on: $RIOT_WEB_VERSION_TAG"

echo -n "release? [yN] "
read proceed
if [[ $proceed != "y" && $proceed != "Y" ]]; then
  echo "aborting"
  exit 1
fi

git pull

npm run pre-push

RELEASE_VERSION_TAG="v$RELEASE_VERSION"
cd riot-web
  git push --force
  git tag webext-$RELEASE_VERSION_TAG
  git push origin webext-$RELEASE_VERSION_TAG
cd ..

cd matrix-react-sdk
  git push --force
  git tag webext-$RELEASE_VERSION_TAG
  git push origin webext-$RELEASE_VERSION_TAG
cd ..

git add riot-web matrix-* src/manifest.*
git commit -S -m "chore(release): $RELEASE_VERSION_TAG"
git push
git tag $RELEASE_VERSION_TAG
git push origin $RELEASE_VERSION_TAG
echo "Release successful"
