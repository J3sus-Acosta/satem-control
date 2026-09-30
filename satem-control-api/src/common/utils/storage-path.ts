import path from 'path';
import fs from 'fs';
import { env } from '../../config/env.js';

/**
 * Resuelve la ruta física real de un archivo almacenado,
 * manejando diferencias de SO (Windows / Linux / Docker),
 * rutas absolutas guardadas en entornos anteriores y rutas relativas.
 */
export function resolveStoragePath(storedPath: string | null | undefined): string | null {
  if (!storedPath) return null;

  // 1. Si existe directamente tal como está guardado
  if (fs.existsSync(storedPath)) {
    return storedPath;
  }

  // Normalizar separadores
  const normalized = storedPath.replace(/\\/g, '/');

  // 2. Si contiene un segmento "storage/"
  const storageIndex = normalized.indexOf('storage/');
  if (storageIndex !== -1) {
    const relativeFromStorage = normalized.substring(storageIndex + 'storage/'.length);
    const candidatePath = path.join(env.STORAGE_PATH, relativeFromStorage);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  // 3. Probar uniendo directamente con STORAGE_PATH usando el basename
  const baseName = path.basename(storedPath);
  const directCandidate = path.join(env.STORAGE_PATH, baseName);
  if (fs.existsSync(directCandidate)) {
    return directCandidate;
  }

  return null;
}
