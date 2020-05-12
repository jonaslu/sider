#!/bin/bash
if ! git diff-index --quiet HEAD -- ; then
  echo "Don't push with unstaged changes"
  exit 1
fi

SIDER_VERSION="v$(node sider.js version)"

if ! git tag "${SIDER_VERSION}"; then
  echo "Could not create tag ${SIDER_VERSION}"
  exit 1
fi

if ! git push origin "${SIDER_VERSION}"; then
  echo "Could not push tag ${SIDER_VERSION} to origin"
  exit 1;
fi
