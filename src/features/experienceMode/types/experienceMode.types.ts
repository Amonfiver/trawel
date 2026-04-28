/**
 * Tipos del modo de experiencia de Trawel
 * 
 * Propósito: Definir los tipos para el selector de modo Aventura/Estudiante
 * Alcance: Tipos de modo, configuración por modo, y utilidades de tipo
 * 
 * Decisiones técnicas:
 * - ExperienceMode como union type para type safety
 * - ExperienceModeConfig centraliza textos y configuración por modo
 * - Preparado para extender con más modos en el futuro
 * 
 * Limitaciones actuales:
 * - Solo dos modos: adventure y student
 * - Sin persistencia de momento (localStorage futuro)
 */

/** Modos de experiencia disponibles */
export type ExperienceMode = 'adventure' | 'student';

/** Configuración de texto y estilo por modo */
export interface ExperienceModeConfig {
  /** Identificador del modo */
  id: ExperienceMode;
  
  /** Etiqueta visible en el selector */
  label: string;
  
  /** Icono o emoji representativo */
  icon: string;
  
  /** Descripción corta para tooltips o ayuda */
  description: string;
  
  /** Tono de voz/carácter del modo */
  tone: 'emotional' | 'educational';
}

/** Props del componente selector */
export interface ExperienceModeSwitchProps {
  /** Modo actualmente seleccionado */
  currentMode: ExperienceMode;
  
  /** Callback al cambiar de modo */
  onModeChange: (mode: ExperienceMode) => void;
  
  /** Clase CSS adicional */
  className?: string;
}

/** Configuración de contenido que varía por modo */
export interface ModeContent<T> {
  adventure: T;
  student: T;
}

/** Helper para obtener contenido según modo */
export function getModeContent<T>(content: ModeContent<T>, mode: ExperienceMode): T {
  return content[mode];
}