#!/usr/bin/env bash
set -o errexit

export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

npm install

# PuppeteerのChromeを直接インストール
node -e "require('puppeteer').createBrowserFetcher().download('chrome')"