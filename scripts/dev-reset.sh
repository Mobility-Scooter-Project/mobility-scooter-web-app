#!/usr/bin/env bash
set -euo pipefail

echo "Stopping containers..."
docker compose down -v

echo "Starting containers..."
docker compose up -d

echo "Waiting 10 seconds for DB to start..."
sleep 10

echo "Running migrations + seed..."
cd apps/api
pnpm db:migrate
pnpm db:seed
cd ../..

echo "Starting dev servers..."
pnpm dev