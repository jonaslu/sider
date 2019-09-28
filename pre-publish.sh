#!/bin/bash
if ! git diff-index --quiet HEAD -- ; then
  echo "Don't push with unstaged changes"
  exit 1
fi

NPM_VERSION=$(node -e "console.log(require('./package.json').version)")
SIDER_VERSION=$(node main-program -V)

if [ $NPM_VERSION != $SIDER_VERSION ]; then
  echo "NPM and sider -V differs"
  exit 1
fi
