/**
 * VisualPlaceholder - Componente para placeholders visuales de fotos futuras
 *
 * Propósito: Mostrar un recuadro elegante que indica dónde irá una foto
 * cuando esté disponible. Soporta diferentes estilos (gradient, dashed),
 * tamaños y tipos de contenido visual.
 *
 * Uso:
 * ```tsx
 * <VisualPlaceholder kind="ciudad" size="hero" variant="dashed" />
 * <VisualPlaceholder kind="monumento" size="card" label="Vista panorámica" />
 * ```
 */

import styles from './VisualPlaceholder.module.css';

export type VisualKind =
  | 'pais'
  | 'ciudad'
  | 'paisaje'
  | 'monumento'
  | 'aventura'
  | 'ruta'
  | 'cultura'
  | 'naturaleza'
  | 'gastronomia'
  | 'costa'
  | 'montaña'
  | 'zona';

export type VisualPlaceholderVariant = 'gradient' | 'dashed';

export type VisualPlaceholderSize = 'hero' | 'card' | 'small';

export interface VisualPlaceholderProps {
  /** Tipo de contenido visual (determina icono y colores) */
  kind?: VisualKind;
  /** Variante de estilo visual */
  variant?: VisualPlaceholderVariant;
  /** Tamaño del placeholder */
  size?: VisualPlaceholderSize;
  /** Etiqueta principal (opcional, usa default según kind) */
  label?: string;
  /** Texto secundario de hint (opcional, usa default) */
  hint?: string;
  /** Label para accesibilidad */
  ariaLabel?: string;
  /** Clases CSS adicionales */
  className?: string;
}

const defaultLabels: Record<VisualKind, { label: string; icon: string }> = {
  pais: { label: 'Vista del país', icon: '🌍' },
  ciudad: { label: 'Foto panorámica de la ciudad', icon: '📷' },
  paisaje: { label: 'Vista panorámica', icon: '🏔️' },
  monumento: { label: 'Lugar emblemático', icon: '🏛️' },
  aventura: { label: 'Experiencia de viaje', icon: '🎒' },
  ruta: { label: 'Ruta por descubrir', icon: '🗺️' },
  cultura: { label: 'Experiencia cultural', icon: '🎭' },
  naturaleza: { label: 'Entorno natural', icon: '🌿' },
  gastronomia: { label: 'Gastronomía local', icon: '🍽️' },
  costa: { label: 'Vista costera', icon: '🏖️' },
  montaña: { label: 'Paisaje de montaña', icon: '⛰️' },
  zona: { label: 'Foto panorámica de la zona', icon: '🏞️' },
};

/**
 * VisualPlaceholder - Placeholder visual para fotos futuras
 *
 * Muestra un recuadro elegante con icono y texto que indica
 * qué tipo de imagen se mostrará en el futuro.
 */
export function VisualPlaceholder({
  kind = 'paisaje',
  variant = 'dashed',
  size = 'card',
  label,
  hint,
  ariaLabel,
  className = '',
}: VisualPlaceholderProps) {
  const config = defaultLabels[kind];
  const displayLabel = label ?? config.label;
  const displayHint = hint ?? 'Imagen editorial pendiente';
  const displayAriaLabel = ariaLabel ?? displayLabel;

  return (
    <div
      className={`${styles.wrapper} ${styles[size]} ${className}`}
      role="img"
      aria-label={displayAriaLabel}
    >
      <div
        className={`${styles.placeholder} ${styles[variant]}`}
        data-kind={kind}
        data-size={size}
      >
        <span className={styles.icon}>{config.icon}</span>
        <span className={styles.label}>{displayLabel}</span>
        <span className={styles.hint}>{displayHint}</span>
      </div>
    </div>
  );
}

export default VisualPlaceholder;