import fs from 'fs';
import path from 'path';

try {
  const userUploadedDir = 'C:\\Users\\Usuario\\.gemini\\antigravity-ide\\brain\\367dd112-c629-411a-9750-a61cf1ccb8b7\\.user_uploaded';
  const shortLogoPath = path.join(userUploadedDir, 'media_1788917982090.png');
  const fullLogoPath = path.join(userUploadedDir, 'media_1788917982095.png');

  const webPublicAssets = path.resolve('../satem-control-web/public/assets');
  if (!fs.existsSync(webPublicAssets)) {
    fs.mkdirSync(webPublicAssets, { recursive: true });
  }

  fs.copyFileSync(shortLogoPath, path.join(webPublicAssets, 'logo-icon.png'));
  fs.copyFileSync(fullLogoPath, path.join(webPublicAssets, 'logo-full.png'));

  console.log('✅ Logos copiados a satem-control-web/public/assets');
} catch (err) {
  console.error('❌ Error en copy-web-assets:', err);
  process.exit(1);
}
