/**
 * Configuración de modos de experiencia de Trawel
 * 
 * Propósito: Definir la configuración por defecto y textos de cada modo
 * Alcance: Modo por defecto, configuración de modos, textos dinámicos
 * 
 * Decisiones técnicas:
 * - Modo por defecto: 'adventure' (experiencia emocional primaria)
 * - Configuración centralizada para fácil modificación
 * - Textos diferenciados por modo para HomePage
 * 
 * Limitaciones actuales:
 * - Sin persistencia en localStorage (futuro)
 * - Textos estáticos, no cargados de API/DB
 */

import type { ExperienceMode, ExperienceModeConfig, ModeContent } from '../types/experienceMode.types';

/** Modo de experiencia por defecto */
export const DEFAULT_EXPERIENCE_MODE: ExperienceMode = 'adventure';

/** Configuración completa de cada modo */
export const EXPERIENCE_MODES: Record<ExperienceMode, ExperienceModeConfig> = {
  adventure: {
    id: 'adventure',
    label: 'Aventura',
    icon: '🎒',
    description: 'Explora el mundo con emoción y descubre destinos increíbles',
    tone: 'emotional',
  },
  student: {
    id: 'student',
    label: 'Estudiante',
    icon: '📚',
    description: 'Aprende sobre cultura, historia y geografía de cada destino',
    tone: 'educational',
  },
};

/** Lista de modos disponibles para iterar */
export const AVAILABLE_EXPERIENCE_MODES: ExperienceMode[] = ['adventure', 'student'];

/**
 * Obtiene la configuración de un modo específico
 */
export function getExperienceModeConfig(mode: ExperienceMode): ExperienceModeConfig {
  return EXPERIENCE_MODES[mode];
}

/**
 * Obtiene el label de un modo
 */
export function getExperienceModeLabel(mode: ExperienceMode): string {
  return EXPERIENCE_MODES[mode].label;
}

/**
 * Textos de HomePage que varían según el modo
 */
export const HOME_PAGE_CONTENT: ModeContent<{
  heroTitle: string;
  heroSubtitle: string;
  ctaTitle: string;
  ctaText: string;
  sectionDescription: string;
}> = {
  adventure: {
    heroTitle: 'Explora el mundo con Trawel',
    heroSubtitle: 'Descubre destinos únicos seleccionados para viajeros curiosos y aventureros',
    ctaTitle: '¿Listo para tu próxima aventura?',
    ctaText: 'Explora nuestros destinos disponibles y descubre experiencias únicas que cambiarán tu perspectiva del mundo.',
    sectionDescription: 'Haz clic en cualquier país destacado en el mapa o selecciona uno de nuestros destinos curados:',
  },
  student: {
    heroTitle: 'Aprende sobre el mundo con Trawel',
    heroSubtitle: 'Descubre la cultura, historia y geografía de destinos fascinantes',
    ctaTitle: '¿Listo para aprender?',
    ctaText: 'Explora nuestros destinos educativos y descubre el conocimiento que el mundo tiene para ofrecerte.',
    sectionDescription: 'Selecciona un país en el mapa o elige uno de nuestros destinos educativos:',
  },
};

/**
 * Obtiene contenido de HomePage según el modo actual
 */
export function getHomePageContent(mode: ExperienceMode) {
  return HOME_PAGE_CONTENT[mode];
}

/**
 * Verifica si un modo es válido
 */
export function isValidExperienceMode(mode: string): mode is ExperienceMode {
  return AVAILABLE_EXPERIENCE_MODES.includes(mode as ExperienceMode);
}