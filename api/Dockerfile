FROM node:20-slim

RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate && npm run build

EXPOSE 3000

COPY migrate.sql ./migrate.sql

CMD ["/bin/sh", "-c", "psql $DATABASE_URL -f /app/migrate.sql || echo '[MIGRATE] psql failed, continuing...'; exec node dist/src/main"]
