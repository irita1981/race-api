# Puppeteer公式の安定イメージをベースにする
FROM ghcr.io/puppeteer/puppeteer:21.3.8

WORKDIR /app

# 依存関係をインストール
COPY package*.json ./
RUN npm ci --omit=dev

# アプリ本体をコピー
COPY . .

# Renderが割り当てるPORTを使う
ENV PORT=10000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

CMD ["node", "index.js"]