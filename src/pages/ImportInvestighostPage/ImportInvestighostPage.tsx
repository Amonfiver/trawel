/**
 * Página de validación de JSON de Investighost-GPT
 * 
 * Propósito: Permitir pegar y validar JSON generado por Investighost-GPT
 * antes de convertirlo en datos Trawel. Herramienta interna temporal.
 * 
 * Alcance: 
 * - Validación básica de estructura JSON
 * - Previsualización de contenido
 * - Sin persistencia ni modificación de datos reales
 * 
 * Decisiones técnicas:
 * - Ruta bajo /dev/ para indicar que es herramienta interna
 * - Validación manual de campos requeridos según contrato
 * - Estado local con useState, sin efectos secundarios
 * - Sin conexión a base de datos ni datos reales
 * 
 * Limitaciones temporales:
 * - No guarda datos (solo valida y muestra)
 * - No modifica countries/cities/destinations existentes
 * - Solo para uso de desarrollo/contenido
 * 
 * Cambios recientes:
 * - 2026-04-28: Creación inicial de la página de validación
 */

import { useState } from 'react';
import styles from './ImportInvestighostPage.module.css';

/**
 * Tipo para el resultado de validación
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  cityName?: string;
  destinationCount?: number;
  sourcesCount?: number;
  pendingCount?: number;
}

/**
 * Tipo para la estructura esperada del JSON de Investighost-GPT
 */
interface InvestighostCity {
  citySlug: string;
  name: {
    es: string;
  };
  shortDescription?: {
    es: string;
  };
  contentByMode?: {
    adventure?: {
      es: string;
    };
    student?: {
      es: string;
    };
  };
}

interface InvestighostDestination {
  countrySlug: string;
  citySlug: string;
  destinationSlug: string;
  title: {
    es: string;
  };
  summary: {
    es: string;
  };
  contentByMode: {
    adventure: {
      es: string;
    };
    student: {
      es: string;
    };
  };
  type: string;
  status: string;
  tags?: string[];
  estimatedVisitTime?: string;
  price?: {
    es: string;
  };
  openingHours?: {
    es: string;
  };
  sources?: Array<{
    title: string;
    url?: string;
    type?: string;
    consultedAt?: string;
  }>;
  pendingVerification?: string[];
}

interface InvestighostPayload {
  meta?: Record<string, unknown>;
  city: InvestighostCity;
  destinations: InvestighostDestination[];
  globalSources: Array<{
    title: string;
    url?: string;
    type?: string;
    consultedAt?: string;
  }>;
  globalPendingVerification: string[];
}

/**
 * ImportInvestighostPage - Validador de JSON de Investighost-GPT
 * 
 * Herramienta interna para validar y previsualizar contenido generado
 * por Investighost-GPT antes de incorporarlo a Trawel.
 */
export function ImportInvestighostPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [parsedData, setParsedData] = useState<InvestighostPayload | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Valida el JSON según el contrato de Investighost-GPT
   */
  const validateJSON = (): void => {
    setIsValidating(true);
    const errors: string[] = [];
    let payload: InvestighostPayload | null = null;

    // 1. Validar que el JSON parsea correctamente
    try {
      payload = JSON.parse(jsonInput) as InvestighostPayload;
    } catch (e) {
      errors.push('JSON inválido: no se puede parsear. Verifica la sintaxis.');
      setResult({
        valid: false,
        errors,
      });
      setParsedData(null);
      setIsValidating(false);
      return;
    }

    // 2. Validar que existe city
    if (!payload.city) {
      errors.push('Falta el campo obligatorio: city');
    } else {
      // 3. Validar city.citySlug
      if (!payload.city.citySlug) {
        errors.push('Falta el campo obligatorio: city.citySlug');
      }

      // 4. Validar city.name.es
      if (!payload.city.name?.es) {
        errors.push('Falta el campo obligatorio: city.name.es');
      }
    }

    // 5. Validar que existe destinations y es array
    if (!payload.destinations) {
      errors.push('Falta el campo obligatorio: destinations');
    } else if (!Array.isArray(payload.destinations)) {
      errors.push('El campo destinations debe ser un array');
    } else {
      // 6. Validar cada destination
      payload.destinations.forEach((dest, index) => {
        const prefix = `Destino[${index}]`;
        
        if (!dest.countrySlug) {
          errors.push(`${prefix}: Falta countrySlug`);
        }
        if (!dest.citySlug) {
          errors.push(`${prefix}: Falta citySlug`);
        }
        if (!dest.destinationSlug) {
          errors.push(`${prefix}: Falta destinationSlug`);
        }
        if (!dest.title?.es) {
          errors.push(`${prefix}: Falta title.es`);
        }
        if (!dest.summary?.es) {
          errors.push(`${prefix}: Falta summary.es`);
        }
        if (!dest.contentByMode?.adventure?.es) {
          errors.push(`${prefix}: Falta contentByMode.adventure.es`);
        }
        if (!dest.contentByMode?.student?.es) {
          errors.push(`${prefix}: Falta contentByMode.student.es`);
        }
        if (!dest.type) {
          errors.push(`${prefix}: Falta type`);
        }
        if (!dest.status) {
          errors.push(`${prefix}: Falta status`);
        }
      });
    }

    // 7. Validar que existen globalSources (puede estar vacío)
    if (!payload.globalSources || !Array.isArray(payload.globalSources)) {
      errors.push('Falta el campo globalSources (puede ser array vacío)');
    }

    // 8. Validar que existe globalPendingVerification (puede estar vacío)
    if (!payload.globalPendingVerification || !Array.isArray(payload.globalPendingVerification)) {
      errors.push('Falta el campo globalPendingVerification (puede ser array vacío)');
    }

    const validationResult: ValidationResult = {
      valid: errors.length === 0,
      errors,
      cityName: payload.city?.name?.es,
      destinationCount: payload.destinations?.length,
      sourcesCount: payload.globalSources?.length,
      pendingCount: payload.globalPendingVerification?.length,
    };

    setResult(validationResult);
    setParsedData(payload);
    setIsValidating(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Importar desde Investighost-GPT</h1>
        <p className={styles.subtitle}>
          Herramienta interna para validar JSON generado por Investighost-GPT
        </p>
      </header>

      <main className={styles.main}>
        {/* Sección de entrada JSON */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>JSON de Investighost-GPT</h2>
          <textarea
            className={styles.textarea}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`Pega aquí el JSON generado por Investighost-GPT...

Estructura esperada:
{
  "meta": {...},
  "city": {
    "citySlug": "...",
    "name": {"es": "..."},
    ...
  },
  "destinations": [...],
  "globalSources": [...],
  "globalPendingVerification": [...]
}`}
            rows={12}
          />
          <button
            className={styles.validateButton}
            onClick={validateJSON}
            disabled={!jsonInput.trim() || isValidating}
          >
            {isValidating ? 'Validando...' : 'Validar JSON'}
          </button>
        </section>

        {/* Resultado de validación */}
        {result && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Resultado de validación</h2>
            
            <div className={`${styles.statusCard} ${result.valid ? styles.valid : styles.invalid}`}>
              <div className={styles.statusHeader}>
                <span className={styles.statusIcon}>{result.valid ? '✅' : '❌'}</span>
                <span className={styles.statusText}>
                  {result.valid ? 'JSON válido' : 'JSON inválido'}
                </span>
              </div>
              
              {result.valid && (
                <div className={styles.summary}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Ciudad:</span>
                    <span className={styles.summaryValue}>{result.cityName}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Destinos:</span>
                    <span className={styles.summaryValue}>{result.destinationCount}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Fuentes globales:</span>
                    <span className={styles.summaryValue}>{result.sourcesCount}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Pendientes globales:</span>
                    <span className={styles.summaryValue}>{result.pendingCount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de errores */}
            {result.errors.length > 0 && (
              <div className={styles.errorsSection}>
                <h3 className={styles.errorsTitle}>Errores encontrados:</h3>
                <ul className={styles.errorsList}>
                  {result.errors.map((error, index) => (
                    <li key={index} className={styles.errorItem}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Previsualización */}
        {result?.valid && parsedData && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Previsualización</h2>
            
            {/* Info de ciudad */}
            <div className={styles.previewCard}>
              <h3 className={styles.previewCardTitle}>Ciudad</h3>
              <div className={styles.cityInfo}>
                <h4 className={styles.cityName}>{parsedData.city.name.es}</h4>
                <p className={styles.citySlug}>Slug: {parsedData.city.citySlug}</p>
                {parsedData.city.shortDescription?.es && (
                  <p className={styles.cityDescription}>{parsedData.city.shortDescription.es}</p>
                )}
                {parsedData.city.contentByMode?.adventure?.es && (
                  <div className={styles.modeContent}>
                    <h5 className={styles.modeTitle}>Modo Aventura:</h5>
                    <p className={styles.modeText}>
                      {parsedData.city.contentByMode.adventure.es.substring(0, 200)}
                      {parsedData.city.contentByMode.adventure.es.length > 200 ? '...' : ''}
                    </p>
                  </div>
                )}
                {parsedData.city.contentByMode?.student?.es && (
                  <div className={styles.modeContent}>
                    <h5 className={styles.modeTitle}>Modo Estudiante:</h5>
                    <p className={styles.modeText}>
                      {parsedData.city.contentByMode.student.es.substring(0, 200)}
                      {parsedData.city.contentByMode.student.es.length > 200 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de destinos */}
            <div className={styles.previewCard}>
              <h3 className={styles.previewCardTitle}>
                Destinos ({parsedData.destinations.length})
              </h3>
              <div className={styles.destinationsList}>
                {parsedData.destinations.map((dest, index) => (
                  <div key={index} className={styles.destinationItem}>
                    <div className={styles.destinationHeader}>
                      <h4 className={styles.destinationTitle}>{dest.title.es}</h4>
                      <span className={`${styles.statusBadge} ${styles[dest.status]}`}>
                        {dest.status}
                      </span>
                    </div>
                    <div className={styles.destinationMeta}>
                      <span className={styles.destinationType}>Tipo: {dest.type}</span>
                      <span className={styles.destinationSlug}>Slug: {dest.destinationSlug}</span>
                    </div>
                    <p className={styles.destinationSummary}>{dest.summary.es}</p>
                    {dest.tags && dest.tags.length > 0 && (
                      <div className={styles.tags}>
                        {dest.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fuentes globales */}
            {parsedData.globalSources.length > 0 && (
              <div className={styles.previewCard}>
                <h3 className={styles.previewCardTitle}>
                  Fuentes globales ({parsedData.globalSources.length})
                </h3>
                <ul className={styles.sourcesList}>
                  {parsedData.globalSources.map((source, index) => (
                    <li key={index} className={styles.sourceItem}>
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                          {source.title}
                        </a>
                      ) : (
                        <span>{source.title}</span>
                      )}
                      {source.type && <span className={styles.sourceType}>({source.type})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pendientes globales */}
            {parsedData.globalPendingVerification.length > 0 && (
              <div className={styles.previewCard}>
                <h3 className={styles.previewCardTitle}>
                  Pendientes de verificar ({parsedData.globalPendingVerification.length})
                </h3>
                <ul className={styles.pendingList}>
                  {parsedData.globalPendingVerification.map((item, index) => (
                    <li key={index} className={styles.pendingItem}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}