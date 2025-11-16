#!/usr/bin/env bash
set -o errexit

# Puppeteer用キャッシュディレクトリを作成
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# 依存パッケージをインストール
npm install

# Chromiumをインストール
npx puppeteer browsers install chrome

# 明示的に正常終了
exit 0