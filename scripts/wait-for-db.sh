#!/bin/sh
# wait-for-db.sh — Wait for MySQL 8.0 database service readiness

echo "⏳ Esperando disponibilidad de base de datos MySQL..."

until npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; do
  echo "⌛ MySQL no responde aún. Reintentando en 3 segundos..."
  sleep 3
done

echo "✅ Base de datos MySQL conectada y lista."
