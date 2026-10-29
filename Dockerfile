FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runtime

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ /app/src
COPY public/ /app/public
COPY --chown=node:node data/fixtures/mystery-shack-tax-exemption.pdf ./data/fixtures/mystery-shack-tax-exemption.pdf

RUN mkdir -p data/uploads data/bulk-tax-documents && \
    chown -R node:node data

USER node

EXPOSE 3000

CMD ["node", "src/main.ts"]
