#!/bin/sh
set -e

echo "==> Generating Prisma schema from schema.config.json..."
PRISMA_SCHEMA_PATH=/app/prisma/schema.prisma node src/generate-prisma.js

echo "==> Generating Prisma client..."
npx prisma generate --schema=/app/prisma/schema.prisma

echo "==> Waiting for database..."
until npx prisma db push --schema=/app/prisma/schema.prisma --accept-data-loss 2>/dev/null; do
  echo "    Database not ready, retrying in 2s..."
  sleep 2
done

echo "==> Database schema synced"

echo "==> Seeding database..."
node src/seed.js || echo "    Seed skipped (may already exist)"

echo "==> Starting server..."
exec node src/index.js
