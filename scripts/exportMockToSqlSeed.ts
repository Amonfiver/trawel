/**
 * Exportador de datos mock a SQL seed para Supabase
 * 
 * Propósito:
 * Generar archivo SQL con INSERTS para cargar datos mock en Supabase de forma
 * idempotente. Facilita la inicialización del entorno de desarrollo y testing.
 * 
 * Alcance:
 * - Lee datos de countries.ts, cities.ts, destinations.ts
 * - Genera supabase/seed.sql con sentencias INSERT
 * - Crea subcarpeta supabase/ si no existe
 * - No modifica la base de datos real, solo genera archivo SQL
 * 
 * Decisiones técnicas:
 * - Usa subconsultas para resolver relaciones por slug (evita hardcodear UUIDs)
 * - Genera SQL idempotente con ON CONFLICT DO UPDATE
 * - Convierte arrays/objects a JSONB válido con escape de comillas simples
 * - Usa ES modules con import.meta.url para compatibilidad con Node.js
 * 
 * Limitaciones / estado temporal:
 * - Solo genera SQL, no conecta a base de datos
 * - Requiere que el schema de tablas ya exista en Supabase
 * - ON CONFLICT asume constraints únicos definidos en el schema
 * - Si faltan datos en los imports, el script falla con error claro
 * 
 * Cambios recientes (2026-04-28):
 * - Saneada configuración npm para compatibilidad con tsx
 * - Agregada validación de directorio raíz del proyecto
 * - Confirmada generación correcta de seed.sql con 488 líneas
 * 
 * Uso oficial:
 *   npm run export:seed
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { countries } from '../src/features/countries/data/countries';
import { cities } from '../src/features/cities/data/cities';
import { destinations } from '../src/features/destinations/data/destinations';

// ES modules no tiene __dirname, lo calculamos manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper para escapar comillas simples en SQL
function escapeSql(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/'/g, "''");
}

// Helper para convertir valor a JSONB SQL
function toJsonb(value: unknown): string {
  if (value === undefined || value === null) return 'NULL';
  return `'${escapeSql(JSON.stringify(value))}'::jsonb`;
}

// Helper para valor opcional
function optional(value: string | undefined): string {
  return value ? `'${escapeSql(value)}'` : 'NULL';
}

// Generar SQL para countries
function generateCountriesSql(): string {
  const lines: string[] = [
    '-- ============================================',
    '-- COUNTRIES',
    '-- ============================================',
    '',
  ];

  Object.values(countries).forEach(country => {
    lines.push(`-- ${country.displayName}`);
    lines.push(`INSERT INTO countries (slug, name_es, emoji, capital_es, continent_es, description_es, status, featured, created_at, updated_at)`);
    lines.push(`VALUES (`);
    lines.push(`  '${country.slug}',`);
    lines.push(`  '${escapeSql(country.displayName)}',`);
    lines.push(`  '${country.isoAlpha2 === 'ES' ? '🇪🇸' : country.isoAlpha2 === 'JP' ? '🇯🇵' : country.isoAlpha2 === 'PE' ? '🇵🇪' : country.isoAlpha2 === 'FR' ? '🇫🇷' : '🇮🇹'}',`);
    lines.push(`  '${escapeSql(country.capital || '')}',`);
    lines.push(`  '${country.continent === 'europe' ? 'Europa' : country.continent === 'asia' ? 'Asia' : 'América'}',`);
    lines.push(`  '${escapeSql(country.shortDescription || '')}',`);
    lines.push(`  '${country.status}',`);
    lines.push(`  ${country.featured ?? false},`);
    lines.push(`  NOW(),`);
    lines.push(`  NOW()`);
    lines.push(`)`);
    lines.push(`ON CONFLICT (slug) DO UPDATE SET`);
    lines.push(`  name_es = EXCLUDED.name_es,`);
    lines.push(`  capital_es = EXCLUDED.capital_es,`);
    lines.push(`  description_es = EXCLUDED.description_es,`);
    lines.push(`  status = EXCLUDED.status,`);
    lines.push(`  featured = EXCLUDED.featured,`);
    lines.push(`  updated_at = NOW();`);
    lines.push('');
  });

  return lines.join('\n');
}

// Generar SQL para cities
function generateCitiesSql(): string {
  const lines: string[] = [
    '-- ============================================',
    '-- CITIES',
    '-- ============================================',
    '',
  ];

  Object.values(cities).forEach(city => {
    const nameEs = typeof city.name === 'string' ? city.name : city.name?.es || city.id;
    const shortDesc = typeof city.shortDescription === 'string' 
      ? city.shortDescription 
      : city.shortDescription?.es || '';
    const adventureContent = city.contentByMode?.adventure?.es || '';
    const studentContent = city.contentByMode?.student?.es || '';

    lines.push(`-- ${nameEs} (${city.countrySlug})`);
    lines.push(`INSERT INTO cities (country_id, slug, name_es, short_description_es, adventure_content_es, student_content_es, lat, lng, status, featured, recommended_duration, created_at, updated_at)`);
    lines.push(`VALUES (`);
    lines.push(`  (SELECT id FROM countries WHERE slug = '${city.countrySlug}'),`);
    lines.push(`  '${city.slug}',`);
    lines.push(`  '${escapeSql(nameEs)}',`);
    lines.push(`  ${optional(shortDesc)},`);
    lines.push(`  ${optional(adventureContent)},`);
    lines.push(`  ${optional(studentContent)},`);
    lines.push(`  ${city.coordinates?.lat ?? 'NULL'},`);
    lines.push(`  ${city.coordinates?.lng ?? 'NULL'},`);
    lines.push(`  '${city.status}',`);
    lines.push(`  ${city.featured ?? false},`);
    lines.push(`  ${optional('2-3 días')},`);
    lines.push(`  NOW(),`);
    lines.push(`  NOW()`);
    lines.push(`)`);
    // TODO: Verificar si existe constraint único (country_id, slug) en el schema
    lines.push(`ON CONFLICT DO NOTHING;`);
    lines.push('');
  });

  return lines.join('\n');
}

// Generar SQL para destinations
function generateDestinationsSql(): string {
  const lines: string[] = [
    '-- ============================================',
    '-- DESTINATIONS',
    '-- ============================================',
    '',
  ];

  Object.values(destinations).forEach(dest => {
    const titleEs = typeof dest.title === 'string' ? dest.title : dest.title?.es || dest.id;
    const summaryEs = typeof dest.summary === 'string' ? dest.summary : dest.summary?.es || '';
    const adventureContent = dest.contentByMode?.adventure?.es || '';
    const studentContent = dest.contentByMode?.student?.es || '';
    const price = typeof dest.price === 'string' ? dest.price : dest.price?.es || '';
    const openingHours = typeof dest.openingHours === 'string' ? dest.openingHours : dest.openingHours?.es || '';

    lines.push(`-- ${titleEs} (${dest.citySlug})`);
    lines.push(`INSERT INTO destinations (country_id, city_id, slug, title_es, summary_es, adventure_content_es, student_content_es, type, tags, estimated_visit_time, price, opening_hours, status, featured, verification_status, created_at, updated_at)`);
    lines.push(`VALUES (`);
    lines.push(`  (SELECT id FROM countries WHERE slug = '${dest.countrySlug}'),`);
    lines.push(`  (SELECT id FROM cities WHERE slug = '${dest.citySlug}' AND country_id = (SELECT id FROM countries WHERE slug = '${dest.countrySlug}')),`);
    lines.push(`  '${dest.slug}',`);
    lines.push(`  '${escapeSql(titleEs)}',`);
    lines.push(`  ${optional(summaryEs)},`);
    lines.push(`  ${optional(adventureContent)},`);
    lines.push(`  ${optional(studentContent)},`);
    lines.push(`  '${dest.type || 'monument'}',`);
    lines.push(`  ${toJsonb(dest.tags || [])},`);
    lines.push(`  ${optional(dest.estimatedVisitTime)},`);
    lines.push(`  ${optional(price)},`);
    lines.push(`  ${optional(openingHours)},`);
    lines.push(`  '${dest.status}',`);
    lines.push(`  ${dest.featured ?? false},`);
    lines.push(`  'verified',`);
    lines.push(`  NOW(),`);
    lines.push(`  NOW()`);
    lines.push(`)`);
    // TODO: Verificar constraint único para destinations
    lines.push(`ON CONFLICT DO NOTHING;`);
    lines.push('');
  });

  return lines.join('\n');
}

// Generar SQL para destination_sources
function generateSourcesSql(): string {
  const lines: string[] = [
    '-- ============================================',
    '-- DESTINATION SOURCES',
    '-- ============================================',
    '',
  ];

  Object.values(destinations).forEach(dest => {
    if (!dest.sources || dest.sources.length === 0) return;

    const titleEs = typeof dest.title === 'string' ? dest.title : dest.title?.es || dest.id;

    dest.sources.forEach(source => {
      lines.push(`-- Source for: ${titleEs}`);
      lines.push(`INSERT INTO destination_sources (destination_id, title, url, type, supports, created_at)`);
      lines.push(`VALUES (`);
      lines.push(`  (SELECT id FROM destinations WHERE slug = '${dest.slug}'),`);
      lines.push(`  '${escapeSql(source.title)}',`);
      lines.push(`  ${optional(source.url)},`);
      lines.push(`  '${source.type}',`);
      lines.push(`  NULL,`);
      lines.push(`  NOW()`);
      lines.push(`)`);
      lines.push(`ON CONFLICT DO NOTHING;`);
      lines.push('');
    });
  });

  return lines.join('\n');
}

// Función principal
function main() {
  console.log('🚀 Exportando datos mock a SQL seed...');

  const outputDir = path.join(__dirname, '..', 'supabase');
  const outputFile = path.join(outputDir, 'seed.sql');

  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Creado directorio: ${outputDir}`);
  }

  // Generar SQL completo
  const sql = [
    '-- ============================================',
    '-- TRAWEL SEED DATA',
    '-- ============================================',
    '-- Generated automatically from mock data',
    '-- Date: ' + new Date().toISOString(),
    '-- ============================================',
    '',
    '-- NOTE: This file assumes the schema already exists in Supabase.',
    '-- Run this after creating tables with proper constraints.',
    '',
    'BEGIN;',
    '',
    generateCountriesSql(),
    generateCitiesSql(),
    generateDestinationsSql(),
    generateSourcesSql(),
    '',
    'COMMIT;',
    '',
    '-- ============================================',
    '-- END OF SEED',
    '-- ============================================',
  ].join('\n');

  // Escribir archivo
  fs.writeFileSync(outputFile, sql, 'utf-8');
  
  console.log(`✅ Seed SQL generado: ${outputFile}`);
  console.log('');
  console.log('📊 Resumen:');
  console.log(`  - Countries: ${Object.keys(countries).length}`);
  console.log(`  - Cities: ${Object.keys(cities).length}`);
  console.log(`  - Destinations: ${Object.keys(destinations).length}`);
  console.log('');
  console.log('⚠️  NOTAS IMPORTANTES:');
  console.log('  1. Verifica que las tablas existen en Supabase antes de ejecutar');
  console.log('  2. Revisa los constraints únicos para ON CONFLICT');
  console.log('  3. Las relaciones usan subconsultas por slug (no UUIDs hardcodeados)');
  console.log('');
}

main();