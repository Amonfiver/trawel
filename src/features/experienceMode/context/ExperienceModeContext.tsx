/**
 * Context global para el modo de experiencia de Trawel
 * 
 * Propósito: Proveer estado global del modo (adventure/student) a toda la app
 * 
 * Alcance:
 * - Estado global del modo de experiencia
 * - Persistencia en localStorage
 * - Hook useExperienceMode para consumir el contexto
 * 
 * Decisiones técnicas:
 * - React Context + useState para estado global simple
 * - localStorage para persistencia entre sesiones
 * - Valor por defecto: 'adventure'
 * - Provider envuelve toda la aplicación en App.tsx
 */

import { useState, useEffect, type ReactNode } from 'react';
import type { ExperienceMode } from '../types/experienceMode.types';
import {
  ExperienceModeContext,
  STORAGE_KEY,
  type ExperienceModeContextValue,
} from './experienceMode.context';

/**
 * Provider del modo de experiencia
 * 
 * Envuelve la aplicación y provee el estado global del modo.
 * Persiste el modo en localStorage.
 */
export function ExperienceModeProvider({ children }: { children: ReactNode }) {
  // Inicializar desde localStorage o default 'adventure'
  const [mode, setModeState] = useState<ExperienceMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'adventure' || stored === 'student') {
        return stored;
      }
    }
    return 'adventure';
  });

  // Persistir cambios en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = (newMode: ExperienceMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'adventure' ? 'student' : 'adventure');
  };

  const value: ExperienceModeContextValue = {
    mode,
    setMode,
    toggleMode,
  };

  return (
    <ExperienceModeContext.Provider value={value}>
      {children}
    </ExperienceModeContext.Provider>
  );
}
