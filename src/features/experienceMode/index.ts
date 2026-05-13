/**
 * Export público de la feature experienceMode
 * 
 * Uso:
 *   import { ExperienceModeSwitch, useExperienceMode } from '@/features/experienceMode';
 */

export { ExperienceModeSwitch } from './components/ExperienceModeSwitch';
export { ExperienceModeProvider } from './context/ExperienceModeContext';
export { useExperienceMode } from './context/useExperienceMode';
export type { ExperienceMode, ExperienceModeSwitchProps } from './types/experienceMode.types';
export { EXPERIENCE_MODES, AVAILABLE_EXPERIENCE_MODES } from './data/experienceMode.config';
