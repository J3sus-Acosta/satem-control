#!/bin/sh
# migrate.sh — Execute official Prisma migrations safely (NO db push)

set -e

echo "🛠️ Ejecutando 'npx prisma migrate deploy'..."
npx prisma migrate deploy

echo "🔍 Verificando estado de migraciones..."
npx prisma migrate status

echo "✅ Migraciones aplicadas exitosamente."
