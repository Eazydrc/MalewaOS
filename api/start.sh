#!/bin/sh
echo "[START] Running prisma migrate deploy..."
timeout 90 npx prisma migrate deploy
EXIT=$?
if [ $EXIT -eq 124 ]; then
  echo "[START] prisma migrate deploy timed out — continuing anyway"
elif [ $EXIT -ne 0 ]; then
  echo "[START] prisma migrate deploy exited with code $EXIT — continuing anyway"
else
  echo "[START] Migrations applied successfully"
fi
echo "[START] Starting NestJS..."
exec node dist/src/main
