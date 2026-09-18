import type { EditorialContent } from '../productContent';
import type { ScreenEditorialData, ScreenExperienceMode } from './screenData.types';

interface ZoneEditorialContext {
  countrySlug: string;
  zoneSlug: string;
  mode: ScreenExperienceMode;
}

/**
 * Resuelve exclusivamente la primera version devuelta por la consulta ya ordenada.
 * Si esa version no es valida, no recupera una anterior potencialmente obsoleta.
 */
export function resolvePublishedZoneEditorial(
  contents: EditorialContent[],
  context: ZoneEditorialContext
): ScreenEditorialData | null {
  const content = contents[0];

  if (
    !content ||
    content.entityType !== 'zone' ||
    content.entitySlug !== context.zoneSlug ||
    content.countrySlug !== context.countrySlug ||
    content.zoneSlug !== context.zoneSlug ||
    content.mode !== context.mode
  ) {
    return null;
  }

  return normalizePublishedEditorialContent(content);
}

/**
 * Convierte contenido disponible al contrato de pantalla. Trawel no evalúa la
 * completitud editorial: Investighost ya decidió qué campos son consumibles.
 * La comprobación de fecha se conserva como defensa adicional al filtro SQL.
 */
export function normalizePublishedEditorialContent(
  content: EditorialContent | undefined
): ScreenEditorialData | null {
  if (!content || content.status !== 'published' || !content.publishedAt || !content.mode) {
    return null;
  }

  const headline = normalizeOptionalText(content.headline);
  const intro = normalizeOptionalText(content.intro) || '';
  const whatMakesSpecial = normalizeOptionalText(content.whatMakesSpecial);
  const highlights = normalizeRequiredStringList(content.highlights);
  const suggestedRoute = normalizeOptionalText(content.suggestedRoute);
  const practicalTips = normalizeOptionalTextList(content.practicalTips);

  if (!headline) {
    return null;
  }

  return {
    mode: content.mode,
    status: 'published',
    headline,
    intro,
    whatMakesSpecial: whatMakesSpecial || undefined,
    highlights,
    suggestedRoute: suggestedRoute || undefined,
    practicalTips: practicalTips || undefined,
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function normalizeRequiredStringList(value: unknown[]): string[] {
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOptionalTextList(value: unknown[]): string | null {
  const items = normalizeRequiredStringList(value);
  return items.length > 0 ? items.join(' ') : null;
}
