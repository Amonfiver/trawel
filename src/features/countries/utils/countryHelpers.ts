/**
 * Utilidades para países en Trawel
 * 
 * Propósito: Funciones auxiliares para trabajar con datos de países
 * Alcance: Helpers de formato, conversión y presentación
 */

/**
 * Convierte un código ISO Alpha-2 de país a emoji de bandera
 * 
 * Principio: Las banderas de países en Unicode son secuencias de 
 * "regional indicator symbols" (letras A-Z en el rango U+1F1E6-U+1F1FF).
 * 
 * Cada letra del código de 2 caracteres se convierte a su símbolo regional
 * correspondiente. Ejemplo: "ES" → 🇪🇸
 * 
 * @param isoAlpha2 - Código ISO 3166-1 alpha-2 (2 letras, ej: "ES", "JP")
 * @returns Emoji de bandera o string vacío si el código no es válido
 * 
 * @example
 * countryCodeToFlagEmoji('ES') // '🇪🇸'
 * countryCodeToFlagEmoji('JP') // '🇯🇵'
 * countryCodeToFlagEmoji('')   // ''
 * countryCodeToFlagEmoji('INVALID') // ''
 */
export function countryCodeToFlagEmoji(isoAlpha2: string | undefined): string {
  if (!isoAlpha2 || isoAlpha2.length !== 2) {
    return '';
  }

  // Normalizar a mayúsculas y validar que solo contenga letras A-Z
  const upperCode = isoAlpha2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upperCode)) {
    return '';
  }

  // Método estándar: offset 127397 para regional indicator symbols
  // 'A' (65) + 127397 = 127462 (0x1F1E6) = 🇦
  const codePoints = upperCode
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    // Fallback si hay error en conversión
    return '';
  }
}

/**
 * Formatea el nombre de un país con su bandera para mostrar en UI
 * 
 * @param displayName - Nombre para mostrar (ej: "España")
 * @param isoAlpha2 - Código ISO alpha-2 (ej: "ES")
 * @returns String formateado: "🇪🇸 España" o solo "España" si no hay bandera
 * 
 * @example
 * formatCountryWithFlag('España', 'ES') // '🇪🇸 España'
 * formatCountryWithFlag('España', '')   // 'España'
 */
export function formatCountryWithFlag(
  displayName: string,
  isoAlpha2: string | undefined
): string {
  const flag = countryCodeToFlagEmoji(isoAlpha2);
  return flag ? `${flag} ${displayName}` : displayName;
}