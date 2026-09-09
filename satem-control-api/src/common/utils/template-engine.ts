/**
 * Motor de compilación de plantillas HTML Mustache/Handlebars-like
 * Reemplaza variables {{categoria.campo}} dinámicamente
 */
export function compileTemplate(htmlTemplate: string, variables: Record<string, any>): string {
  let result = htmlTemplate;

  function replaceKeys(obj: Record<string, any>, prefix = '') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
          replaceKeys(val, fullKey);
        } else {
          const stringVal = val !== undefined && val !== null ? String(val) : '';
          const regex = new RegExp(`{{\\s*${fullKey.replace('.', '\\.')}\\s*}}`, 'g');
          result = result.replace(regex, stringVal);
        }
      }
    }
  }

  replaceKeys(variables);

  // Limpiar cualquier variable {{...}} no coincidente con vacío o guión
  result = result.replace(/{{\s*[\w\.]+\s*}}/g, '');

  return result;
}
