/**
 * Tipos del sistema de mapas de Trawel
 * 
 * Propósito: Definir tipos para el renderizado de mapas y estados visuales
 * Alcance: Tipos para WorldMap, tooltips, temas y comportamiento de interacción
 * 
 * Decisiones técnicas:
 * - CountryVisualStatus separado de CountryStatus para flexibilidad visual
 * - TooltipData minimalista para no acoplar con datos de dominio completos
 * - Soporte para país seleccionado (navegación actual)
 * 
 * Limitaciones actuales:
 * - Sin tipos para coordenadas geográficas (se añadirán con D3)
 * - Sin tipos para proyecciones cartográficas
 */

import type { CountryStatus } from '../../countries/data/countries.types';

/** Estados visuales posibles de un país en el mapa */
export type CountryVisualStatus = 
  | 'default'      // País sin contenido o no disponible
  | 'active'       // País con contenido disponible
  | 'hover'        // Cursor sobre el país
  | 'selected'     // País actualmente seleccionado/navegado
  | 'highlighted'  // País destacado (promociones, etc.)
  | 'comingSoon'   // Países próximamente (visibles pero no clickeables)
  | 'disabled';    // País deshabilitado/oculto

/** Datos mínimos necesarios para renderizar un país en el mapa */
export interface MapCountryData {
  /** Código ISO Alpha-2 para identificación */
  isoAlpha2: string;
  
  /** Nombre para mostrar en el mapa */
  displayName: string;
  
  /** Estado visual actual del país */
  status: CountryStatus;
  
  /** Número de destinos (para mostrar en tooltip) */
  destinationCount?: number;
}

/** Datos del tooltip del mapa */
export interface MapTooltipData {
  /** Título del tooltip (nombre del país) */
  title: string;
  
  /** Descripción o estado (ej: "3 destinos", "Próximamente") */
  description?: string;
  
  /** Si el país es navegable al hacer click */
  isClickable: boolean;
}

/** Configuración del tema visual del mapa */
export interface MapTheme {
  colors: {
    /** Color de fondo del contenedor del mapa */
    background: string;
    
    /** Color por defecto para países sin contenido */
    default: string;
    
    /** Color para países activos (con contenido) */
    active: string;
    
    /** Color al hacer hover sobre un país */
    hover: string;
    
    /** Color para país seleccionado actualmente */
    selected: string;
    
    /** Color para países destacados */
    highlighted: string;
    
    /** Color para países "Próximamente" */
    comingSoon: string;
    
    /** Color para países deshabilitados */
    disabled: string;
    
    /** Color de los bordes entre países */
    border: string;
    
    /** Grosor de los bordes en píxeles */
    borderWidth: number;
  };
  
  tooltip: {
    /** Color de fondo del tooltip */
    background: string;
    
    /** Color del texto del tooltip */
    textColor: string;
    
    /** Radio de borde del tooltip */
    borderRadius: string;
    
    /** Padding interno del tooltip */
    padding: string;
    
    /** Ancho máximo del tooltip */
    maxWidth: string;
    
    /** Tamaño de fuente del título */
    titleFontSize: string;
    
    /** Tamaño de fuente de la descripción */
    descriptionFontSize: string;
  };
  
  animation: {
    /** Duración de transiciones en ms */
    duration: number;
    
    /** Función de easing para transiciones */
    easing: string;
  };
}

/** Props del componente WorldMap */
export interface WorldMapProps {
  /** Lista de países a renderizar */
  countries: MapCountryData[];
  
  /** Código ISO del país seleccionado (opcional) */
  selectedCountry?: string;
  
  /** Callback al hacer click en un país clickeable */
  onCountryClick?: (isoAlpha2: string) => void;
  
  /** Callback al hacer hover sobre un país */
  onCountryHover?: (isoAlpha2: string | null) => void;
  
  /** Tema visual opcional (usa tema por defecto si no se proporciona) */
  theme?: MapTheme;
  
  /** Clase CSS adicional para el contenedor */
  className?: string;
}

/** Estado del mapa para gestión interna */
export interface WorldMapState {
  /** País sobre el que está el cursor */
  hoveredCountry: string | null;
  
  /** Datos del tooltip actual */
  tooltip: MapTooltipData | null;
  
  /** Posición del tooltip (coordenadas x, y) */
  tooltipPosition: { x: number; y: number } | null;
}