/**
 * Script para descargar assets de geoBoundaries gbOpen
 * 
 * Usa la API oficial de geoBoundaries para obtener GeoJSON de países.
 * 
 * Uso: npx tsx scripts/download-geoboundaries.ts
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      // Seguir redirecciones
      if (response.statusCode === 301 || response.statusCode === 302) {
        if (response.headers.location) {
          log(`Redirigiendo a: ${response.headers.location}`, 'yellow');
          downloadFile(response.headers.location, dest).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Status Code: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      response.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// ============ MAIN ============

async function main() {
  log('Descargando asset de geoBoundaries...', 'cyan');
  
  // Configuración para España ADM2 (provincias)
  const country = 'ESP';
  const admLevel = 'ADM2';
  const outputDir = path.join(process.cwd(), 'public', 'maps', 'countries', 'spain');
  const outputFile = path.join(outputDir, 'spain-adm2-raw.geojson');
  
  // Intentar descarga desde GitHub releases (archivos adjuntos)
  // Usamos una versión específica del release
  const simplifiedReleaseUrl = `https://github.com/wmgeolab/geoBoundaries/releases/download/v6.0.0/gbOpen_${country}_${admLevel}_simplified.geojson`;
  
  log(`Intentando descarga desde GitHub releases...`, 'yellow');
  log(`URL: ${simplifiedReleaseUrl}`, 'dim');
  
  try {
    // Primero intentamos la versión simplificada
    await downloadFile(simplifiedReleaseUrl, outputFile);
    
    const stats = fs.statSync(outputFile);
    log(`Descarga completada: ${(stats.size / 1024).toFixed(2)} KB`, 'green');
    log(`Archivo guardado en: ${outputFile}`, 'green');
    
    // Crear metadatos básicos
    const metadata = {
      source: 'geoBoundaries',
      url: simplifiedReleaseUrl,
      country: country,
      admLevel: admLevel,
      downloadedAt: new Date().toISOString(),
      note: 'Descarga directa desde GitHub - verificar licencia en https://www.geoboundaries.org/license.html'
    };
    
    // Guardar también los metadatos para referencia
    const metadataFile = path.join(outputDir, 'spain-adm2-metadata.json');
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    log(`Metadatos guardados en: ${metadataFile}`, 'green');
    
  } catch (error) {
    log(`Error: ${error}`, 'red');
    process.exit(1);
  }
}

main();