#!/usr/bin/env bash
set -o errexit

# Puppeteer用キャッシュディレクトリを作成
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Chromiumをインストール
npx puppeteer browsers install chrome