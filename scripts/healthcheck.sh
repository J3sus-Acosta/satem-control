#!/bin/sh
# healthcheck.sh — Verify system health and API endpoint

HEALTH_URL="${1:-http://localhost:3000/api/v1/health}"

echo "🔍 Consultando healthcheck en ${HEALTH_URL}..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [ "$STATUS_CODE" -eq 200 ]; then
  echo "✅ Healthcheck OK (HTTP 200)."
  exit 0
else
  echo "❌ Error en Healthcheck: HTTP $STATUS_CODE"
  exit 1
fi
