/**
 * Purpose: Shared context primitives for the experience mode feature.
 * Scope: Context type, storage key, and React context instance.
 * Decisions: Kept outside the provider component so Fast Refresh sees component-only exports.
 */

import { createContext } from 'react';
import type { ExperienceMode } from '../types/experienceMode.types';

export const STORAGE_KEY = 'trawel-experience-mode';

export interface ExperienceModeContextValue {
  /** Modo actual de experiencia */
  mode: ExperienceMode;
  /** Cambiar el modo de experiencia */
  setMode: (mode: ExperienceMode) => void;
  /** Toggle entre modos */
  toggleMode: () => void;
}

export const ExperienceModeContext = createContext<ExperienceModeContextValue | undefined>(
  undefined
);
