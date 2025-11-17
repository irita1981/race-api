#!/usr/bin/env bash
set -o errexit

echo "📦 Installing dependencies..."
npm install

echo "🧩 Installing Chrome manually..."
npx puppeteer install

echo "✅ Build script completed."