#!/usr/bin/env bash
set -o errexit

export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

npm install

# Puppeteer CLI を直接呼び出す
./node_modules/.bin/puppeteer browsers install chrome