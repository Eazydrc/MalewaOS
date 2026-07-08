FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate && npm run build

EXPOSE 3000

COPY migrate-prod.js ./migrate-prod.js

CMD ["/bin/sh", "-c", "node migrate-prod.js && exec node dist/src/main"]
