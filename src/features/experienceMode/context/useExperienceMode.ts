/**
 * Purpose: Hook to consume the global experience mode context.
 * Scope: Read and update adventure/student mode from components.
 */

import { useContext } from 'react';
import {
  ExperienceModeContext,
  type ExperienceModeContextValue,
} from './experienceMode.context';

/**
 * Hook para consumir el modo de experiencia
 *
 * Uso:
 *   const { mode, setMode, toggleMode } = useExperienceMode();
 *
 * @throws Error si se usa fuera del Provider
 */
export function useExperienceMode(): ExperienceModeContextValue {
  const context = useContext(ExperienceModeContext);
  if (context === undefined) {
    throw new Error('useExperienceMode debe usarse dentro de ExperienceModeProvider');
  }
  return context;
}
