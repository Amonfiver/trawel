/**
 * Componente ExperienceModeSwitch - Selector de modo Aventura/Estudiante
 * 
 * Propósito: Permitir al usuario cambiar entre modo emocional (Aventura) 
 *            y modo educativo (Estudiante)
 * Alcance: UI del selector, manejo de clicks, estados activo/inactivo
 * 
 * Decisiones técnicas:
 * - Componente controlado: recibe estado y callback
 * - Diseño visual tipo toggle/pills
 * - Iconos emoji para reconocimiento rápido
 * 
 * Limitaciones actuales:
 * - Sin persistencia automática (delegado al padre)
 * - Sin animaciones complejas
 */

import type { ExperienceModeSwitchProps, ExperienceMode } from '../../types/experienceMode.types';
import { EXPERIENCE_MODES, AVAILABLE_EXPERIENCE_MODES } from '../../data/experienceMode.config';
import styles from './ExperienceModeSwitch.module.css';

/**
 * Selector de modo de experiencia
 * 
 * Muestra dos opciones: Aventura (emocional) y Estudiante (educativo)
 * El modo activo se destaca visualmente.
 */
export function ExperienceModeSwitch({ 
  currentMode, 
  onModeChange, 
  className 
}: ExperienceModeSwitchProps) {
  
  const handleModeClick = (mode: ExperienceMode) => {
    if (mode !== currentMode) {
      onModeChange(mode);
    }
  };

  return (
    <div 
      className={`${styles.container} ${className || ''}`}
      role="group"
      aria-label="Selecciona tu modo de experiencia"
    >
      <span className={styles.label} id="experience-mode-label">
        Modo de experiencia:
      </span>
      
      <div className={styles.switch} role="radiogroup" aria-labelledby="experience-mode-label">
        {AVAILABLE_EXPERIENCE_MODES.map((mode) => {
          const config = EXPERIENCE_MODES[mode];
          const isActive = mode === currentMode;
          
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
              onClick={() => handleModeClick(mode)}
              title={config.description}
            >
              <span className={styles.icon} aria-hidden="true">
                {config.icon}
              </span>
              <span className={styles.optionLabel}>{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}