import type { EditorialContent } from '../productContent';
import type { ScreenEditorialData, ScreenExperienceMode } from './screenData.types';

const ZONE_EDITORIAL_PILOT_COUNTRY_SLUG = 'espana';
const ZONE_EDITORIAL_PILOT_ZONE_SLUG = 'albarracin';

interface ZoneEditorialContext {
  countrySlug: string;
  zoneSlug: string;
  mode: ScreenExperienceMode;
}

/**
 * Mantiene el consumo editorial de zonas cerrado al piloto aprobado.
 * La ampliacion a nuevas zonas requiere una decision editorial explicita.
 */
export function isZoneEditorialPilot(
  countrySlug: string,
  zoneSlug: string
): boolean {
  return (
    normalizeSlug(countrySlug) === ZONE_EDITORIAL_PILOT_COUNTRY_SLUG &&
    normalizeSlug(zoneSlug) === ZONE_EDITORIAL_PILOT_ZONE_SLUG
  );
}

/**
 * Resuelve exclusivamente la primera version devuelta por la consulta ya ordenada.
 * Si esa version no es valida, no recupera una anterior potencialmente obsoleta.
 */
export function resolvePilotZoneEditorial(
  contents: EditorialContent[],
  context: ZoneEditorialContext
): ScreenEditorialData | null {
  if (!isZoneEditorialPilot(context.countrySlug, context.zoneSlug)) {
    return null;
  }

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
 * Convierte contenido editorial publicado y completo al contrato de pantalla.
 * La comprobacion de fecha se conserva aqui como defensa adicional al filtro SQL.
 */
export function normalizePublishedEditorialContent(
  content: EditorialContent | undefined
): ScreenEditorialData | null {
  if (!content || content.status !== 'published' || !content.publishedAt || !content.mode) {
    return null;
  }

  const headline = normalizeRequiredText(content.headline);
  const intro = normalizeRequiredText(content.intro);
  const whatMakesSpecial = normalizeRequiredText(content.whatMakesSpecial);
  const highlights = normalizeRequiredStringList(content.highlights);
  const suggestedRoute = normalizeRequiredText(content.suggestedRoute);
  const practicalTips = normalizeRequiredTextList(content.practicalTips);

  if (
    !headline ||
    !intro ||
    !whatMakesSpecial ||
    highlights.length === 0 ||
    !suggestedRoute ||
    !practicalTips
  ) {
    return null;
  }

  return {
    mode: content.mode,
    status: 'published',
    headline,
    intro,
    whatMakesSpecial,
    highlights,
    suggestedRoute,
    practicalTips,
  };
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRequiredText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function normalizeRequiredStringList(value: unknown[]): string[] {
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRequiredTextList(value: unknown[]): string | null {
  const items = normalizeRequiredStringList(value);
  return items.length > 0 ? items.join(' ') : null;
}
