import fs from 'fs';
import path from 'path';

try {
  const userUploadedDir = 'C:\\Users\\Usuario\\.gemini\\antigravity-ide\\brain\\367dd112-c629-411a-9750-a61cf1ccb8b7\\.user_uploaded';
  const shortLogoPath = path.join(userUploadedDir, 'media_1788917982090.png');
  const fullLogoPath = path.join(userUploadedDir, 'media_1788917982095.png');

  console.log('Reading short logo:', shortLogoPath);
  const shortBase64 = fs.readFileSync(shortLogoPath).toString('base64');
  console.log('Short logo size base64:', shortBase64.length);

  console.log('Reading full logo:', fullLogoPath);
  const fullBase64 = fs.readFileSync(fullLogoPath).toString('base64');
  console.log('Full logo size base64:', fullBase64.length);

  const outputDir = path.resolve('src/assets');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileContent = `export const LOGO_SHORT_BASE64 = "data:image/png;base64,${shortBase64}";
export const LOGO_FULL_BASE64 = "data:image/png;base64,${fullBase64}";
`;

  fs.writeFileSync(path.join(outputDir, 'logos.ts'), fileContent);
  console.log('✅ Logos guardados exitosamente en src/assets/logos.ts');
} catch (err) {
  console.error('❌ Error en save-logos:', err);
  process.exit(1);
}
