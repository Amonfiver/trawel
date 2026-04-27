/**
 * Configuración visual del tema de mapas de Trawel
 * 
 * Propósito: Definir colores, tamaños y comportamientos visuales del mapa
 * Alcance: Tema por defecto y utilidades para personalización
 * 
 * Decisiones técnicas:
 * - Tema centralizado en un solo objeto para fácil modificación
 * - Colores en formato hex para compatibilidad con D3 y CSS
 * - Valores por defecto basados en la paleta de colores de Trawel
 * - Sin dependencias de runtime (puede importarse en cualquier lado)
 * 
 * Limitaciones actuales:
 * - Solo tema claro (se añadirá tema oscuro en el futuro)
 * - Sin soporte para temas dinámicos en tiempo de ejecución
 */

import type { MapTheme } from '../types/map.types';

/**
 * Tema visual por defecto para el mapa de Trawel
 * 
 * Este tema define la apariencia visual de todos los países en el mapa
 * según su estado. Los colores están coordinados con la paleta global
 * definida en src/styles/variables/colors.css
 */
export const defaultMapTheme: MapTheme = {
  colors: {
    // Fondo del contenedor
    background: '#f8fafc', // slate-50
    
    // Países sin contenido específico
    default: '#cbd5e1', // slate-300
    
    // Países con contenido disponible (activos)
    active: '#3b82f6', // blue-500
    
    // Al pasar el cursor sobre cualquier país
    hover: '#f59e0b', // amber-500
    
    // País actualmente seleccionado/navegado
    selected: '#8b5cf6', // violet-500
    
    // Países destacados (promociones, featured)
    highlighted: '#10b981', // emerald-500
    
    // Países "Próximamente"
    comingSoon: '#94a3b8', // slate-400
    
    // Países deshabilitados/ocultos
    disabled: '#e2e8f0', // slate-200
    
    // Bordes entre países
    border: '#ffffff',
    borderWidth: 0.5,
  },
  
  tooltip: {
    background: 'rgba(0, 0, 0, 0.9)',
    textColor: '#ffffff',
    borderRadius: '8px',
    padding: '12px 16px',
    maxWidth: '250px',
    titleFontSize: '16px',
    descriptionFontSize: '14px',
  },
  
  animation: {
    duration: 200, // ms
    easing: 'ease-out',
  },
};

/**
 * Tema minimalista (alternativa)
 * Útil para embeds o cuando se quiere menos color
 */
export const minimalMapTheme: MapTheme = {
  colors: {
    background: '#ffffff',
    default: '#e5e7eb',
    active: '#374151',
    hover: '#6b7280',
    selected: '#111827',
    highlighted: '#000000',
    comingSoon: '#d1d5db',
    disabled: '#f3f4f6',
    border: '#ffffff',
    borderWidth: 1,
  },
  tooltip: {
    background: '#111827',
    textColor: '#ffffff',
    borderRadius: '6px',
    padding: '8px 12px',
    maxWidth: '200px',
    titleFontSize: '14px',
    descriptionFontSize: '12px',
  },
  animation: {
    duration: 150,
    easing: 'ease-in-out',
  },
};

/**
 * Obtiene el color correspondiente a un estado visual
 * 
 * @param theme - Tema del mapa
 * @param status - Estado visual del país
 * @returns Color en formato hex
 */
export function getColorForStatus(
  theme: MapTheme,
  status: keyof Omit<MapTheme['colors'], 'borderWidth'>
): string {
  const color = theme.colors[status];
  return typeof color === 'string' ? color : theme.colors.default;
}

/**
 * Función helper para crear un tema personalizado
 * 
 * @param overrides - Propiedades a sobrescribir del tema por defecto
 * @returns Tema completo con valores mezclados
 */
export function createCustomTheme(
  overrides: Partial<MapTheme>
): MapTheme {
  return {
    colors: {
      ...defaultMapTheme.colors,
      ...overrides.colors,
    },
    tooltip: {
      ...defaultMapTheme.tooltip,
      ...overrides.tooltip,
    },
    animation: {
      ...defaultMapTheme.animation,
      ...overrides.animation,
    },
  };
}

/**
 * Lista de todos los temas disponibles
 */
export const availableThemes = {
  default: defaultMapTheme,
  minimal: minimalMapTheme,
} as const;

export type ThemeName = keyof typeof availableThemes;

/**
 * Obtiene un tema por su nombre
 * 
 * @param name - Nombre del tema
 * @returns Tema solicitado o tema por defecto si no existe
 */
export function getThemeByName(name: ThemeName): MapTheme {
  return availableThemes[name] || defaultMapTheme;
}