#!/bin/sh
# seed.sh — Execute official corporate identity & template seed idempotently

set -e

echo "🌱 Ejecutando seed de datos e identidad corporativa SATEM SpA..."
npx tsx prisma/seed.ts

echo "✅ Seed oficial completado exitosamente."
