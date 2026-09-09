#!/bin/sh
# verify-deployment.sh — Automated verification of EasyPanel deployment

set -e

echo "🚀 Iniciando verificación post-despliegue SATEM Control..."

# 1. Chequeo de migraciones
echo "1️⃣ Comprobando esquema Prisma..."
npx prisma migrate status

# 2. Chequeo de plantilla SOW
echo "2️⃣ Comprobando plantillas documentales sembradas..."
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.documentTemplate.count().then(count => {
  console.log('   ✓ Plantillas sembradas en DB: ' + count + '/10');
  if (count < 10) process.exit(1);
  return prisma.\$disconnect();
});
"

# 3. Chequeo de almacenamiento
echo "3️⃣ Comprobando directorio de almacenamiento persistent /app/storage..."
if [ -d "/app/storage" ]; then
  echo "   ✓ Directorio /app/storage presente."
else
  echo "   ⚠️ Advertencia: /app/storage no montado localmente (asegurar en EasyPanel)."
fi

echo "🎉 VERIFICACIÓN COMPLETA REPRODUCIBLE OK"
