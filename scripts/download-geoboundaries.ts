/**
 * Script automático para descargar assets de geoBoundaries gbOpen
 * 
 * Flujo completo:
 * 1. Consulta API oficial de geoBoundaries
 * 2. Descarga metadata y GeoJSON
 * 3. Ejecuta análisis automático
 * 4. Genera reporte completo
 * 
 * Uso: npm run maps:spain:prepare
 *    o: npx tsx scripts/download-geoboundaries.ts
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { 
  analyzeMapAsset, 
  displayAnalysis, 
  COLORS, 
  formatBytes,
  logSection 
} from './inspect-map-asset.js';

// Configuración
const CONFIG = {
  country: 'ESP',
  admLevel: 'ADM2',
  apiUrls: [
    'https://www.geoboundaries.org/api/current/gbOpen/ESP/ADM2',
    'https://www.geoboundaries.org/api/gb/2.0.0/gbOpen/ESP/ADM2',
  ],
  outputDir: path.join(process.cwd(), 'public', 'maps', 'countries', 'spain'),
  geojsonFile: 'spain-adm2-raw.geojson',
  metadataFile: 'spain-adm2-metadata.json',
};

// ============ UTILIDADES HTTP ============

/**
 * Realiza una petición HTTPS y devuelve la respuesta como string
 * Sigue redirecciones automáticamente
 */
function httpsGet(url: string, maxRedirects: number = 5): Promise<{ data: string; statusCode: number; headers: any }> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Demasiadas redirecciones'));
      return;
    }
    
    https.get(url, (response) => {
      // Seguir redirecciones
      if (response.statusCode === 301 || response.statusCode === 302) {
        const location = response.headers.location;
        if (location) {
          console.log(`${COLORS.yellow}  → Siguiendo redirección (HTTP ${response.statusCode}) a: ${location}${COLORS.reset}`);
          // Resolver URL relativa si es necesario
          const resolvedUrl = location.startsWith('http') ? location : new URL(location, url).toString();
          httpsGet(resolvedUrl, maxRedirects - 1).then(resolve).catch(reject);
          return;
        }
      }
      
      let data = '';
      
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({
          data,
          statusCode: response.statusCode || 0,
          headers: response.headers
        });
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Descarga un archivo desde una URL y lo guarda en una ruta
 */
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      // Seguir redirecciones
      if (response.statusCode === 301 || response.statusCode === 302) {
        const location = response.headers.location;
        if (location) {
          console.log(`${COLORS.yellow}  → Siguiendo redirección a: ${location}${COLORS.reset}`);
          file.close();
          fs.unlink(dest, () => {});
          downloadFile(location, dest).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// ============ FUNCIONES PRINCIPALES ============

/**
 * Consulta la API de geoBoundaries y obtiene metadata
 */
async function fetchMetadata(): Promise<any> {
  let lastError = '';
  
  for (const apiUrl of CONFIG.apiUrls) {
    console.log(`${COLORS.cyan}Consultando API de geoBoundaries...${COLORS.reset}`);
    console.log(`${COLORS.dim}URL: ${apiUrl}${COLORS.reset}\n`);
    
    try {
      const response = await httpsGet(apiUrl);
      
      console.log(`${COLORS.dim}Respuesta HTTP: ${response.statusCode}${COLORS.reset}`);
      
      if (response.statusCode !== 200) {
        lastError = `HTTP ${response.statusCode}`;
        console.log(`${COLORS.yellow}⚠ API devolvió HTTP ${response.statusCode}, probando siguiente URL...${COLORS.reset}\n`);
        continue;
      }
      
      // Mostrar preview de la respuesta
      console.log(`${COLORS.dim}Preview respuesta:${COLORS.reset}`);
      console.log(`  ${response.data.substring(0, 200)}${response.data.length > 200 ? '...' : ''}\n`);
      
      // La API devuelve un array de resultados
      let metadata: any;
      try {
        metadata = JSON.parse(response.data);
      } catch (e) {
        lastError = `Error parseando JSON: ${e}`;
        console.log(`${COLORS.yellow}⚠ Error parseando JSON, probando siguiente URL...${COLORS.reset}\n`);
        continue;
      }
      
      // geoBoundaries devuelve un array
      if (!Array.isArray(metadata)) {
        // Puede ser un objeto directo
        if (typeof metadata === 'object' && metadata !== null) {
          console.log(`${COLORS.green}✓ Metadata recibida como objeto (no array)${COLORS.reset}`);
          return metadata;
        }
        lastError = 'Respuesta no es array ni objeto válido';
        console.log(`${COLORS.yellow}⚠ Respuesta no válida, probando siguiente URL...${COLORS.reset}\n`);
        continue;
      }
      
      if (metadata.length === 0) {
        lastError = 'Array vacío';
        console.log(`${COLORS.yellow}⚠ API devolvió array vacío, probando siguiente URL...${COLORS.reset}\n`);
        continue;
      }
      
      console.log(`${COLORS.green}✓ Metadata recibida correctamente (${metadata.length} elementos)${COLORS.reset}`);
      return metadata[0]; // Tomamos el primer resultado
      
    } catch (error) {
      lastError = String(error);
      console.log(`${COLORS.yellow}⚠ Error: ${error}, probando siguiente URL...${COLORS.reset}\n`);
    }
  }
  
  throw new Error(`Todas las URLs de API fallaron. Último error: ${lastError}`);
}

/**
 * Extrae la URL de descarga GeoJSON de la metadata
 */
function extractGeoJsonUrl(metadata: any): string | null {
  console.log(`${COLORS.cyan}Analizando campos de metadata...${COLORS.reset}`);
  
  // Listar todos los campos disponibles
  const fields = Object.keys(metadata);
  console.log(`Campos disponibles (${fields.length}):`);
  fields.forEach(field => {
    const value = metadata[field];
    const type = typeof value;
    const preview = type === 'string' && value.length > 60 
      ? value.substring(0, 60) + '...' 
      : type === 'object' ? JSON.stringify(value).substring(0, 60) + '...' 
      : String(value);
    console.log(`  • ${COLORS.dim}${field}${COLORS.reset}: ${preview}`);
  });
  
  // Buscar campos típicos de descarga GeoJSON
  const possibleFields = [
    'gjDownloadURL',
    'geoJSON',
    'simplifiedGeometryGeoJSON',
    'gjUrl',
    'downloadURL',
    'geojsonUrl'
  ];
  
  for (const field of possibleFields) {
    if (metadata[field] && typeof metadata[field] === 'string') {
      console.log(`\n${COLORS.green}✓ Campo de descarga encontrado: ${field}${COLORS.reset}`);
      return metadata[field];
    }
  }
  
  // Si no encontramos campo específico, buscamos cualquier URL que termine en .geojson
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string' && value.toLowerCase().endsWith('.geojson')) {
      console.log(`\n${COLORS.yellow}~ URL GeoJSON encontrada en campo: ${key}${COLORS.reset}`);
      return value;
    }
  }
  
  return null;
}

/**
 * Muestra información de licencia de la metadata
 */
function extractLicenseInfo(metadata: any): { license: string; attribution: string } | null {
  const licenseFields = ['license', 'licenseType', 'licenseUrl', 'termsOfUse'];
  const attributionFields = ['attribution', 'citation', 'source', 'attributionText'];
  
  let license = '';
  let attribution = '';
  
  for (const field of licenseFields) {
    if (metadata[field]) {
      license = String(metadata[field]);
      break;
    }
  }
  
  for (const field of attributionFields) {
    if (metadata[field]) {
      attribution = String(metadata[field]);
      break;
    }
  }
  
  // geoBoundaries gbOpen típicamente usa CC BY 4.0
  if (!license && !attribution) {
    return {
      license: 'CC BY 4.0 (típico de geoBoundaries gbOpen)',
      attribution: 'Datos cartográficos: geoBoundaries (CC BY 4.0)'
    };
  }
  
  return { license, attribution };
}

// ============ MAIN ============

async function main() {
  console.log(`${COLORS.bold}${COLORS.cyan}
╔══════════════════════════════════════════════════════════╗
║  Descarga automática: geoBoundaries ESP ADM2 (España)   ║
╚══════════════════════════════════════════════════════════╝
${COLORS.reset}\n`);
  
  // Crear directorio de salida si no existe
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`${COLORS.green}✓ Creado directorio: ${CONFIG.outputDir}${COLORS.reset}\n`);
  }
  
  const geojsonPath = path.join(CONFIG.outputDir, CONFIG.geojsonFile);
  const metadataPath = path.join(CONFIG.outputDir, CONFIG.metadataFile);
  
  // Limpiar archivos anteriores si existen
  if (fs.existsSync(geojsonPath)) {
    fs.unlinkSync(geojsonPath);
    console.log(`${COLORS.yellow}⚠ Eliminado archivo anterior: ${CONFIG.geojsonFile}${COLORS.reset}`);
  }
  
  try {
    // PASO 1: Obtener metadata
    logSection('PASO 1: OBTENER METADATA');
    const metadata = await fetchMetadata();
    
    // Guardar metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`\n${COLORS.green}✓ Metadata guardada en: ${metadataPath}${COLORS.reset}`);
    
    // Extraer y mostrar información de licencia
    const licenseInfo = extractLicenseInfo(metadata);
    if (licenseInfo) {
      console.log(`\n${COLORS.cyan}Información de licencia detectada:${COLORS.reset}`);
      console.log(`  Licencia: ${COLORS.dim}${licenseInfo.license}${COLORS.reset}`);
      console.log(`  Atribución: ${COLORS.dim}${licenseInfo.attribution}${COLORS.reset}`);
    }
    
    // PASO 2: Descargar GeoJSON
    logSection('PASO 2: DESCARGAR GEOJSON');
    
    const downloadUrl = extractGeoJsonUrl(metadata);
    
    if (!downloadUrl) {
      console.error(`\n${COLORS.red}✗ ERROR: No se encontró URL de descarga GeoJSON${COLORS.reset}`);
      console.error(`\nCampos buscados:`);
      console.error(`  - gjDownloadURL`);
      console.error(`  - geoJSON`);
      console.error(`  - simplifiedGeometryGeoJSON`);
      console.error(`  - Cualquier campo con URL terminada en .geojson`);
      console.error(`\nMetadata guardada para inspección manual en:`);
      console.error(`  ${metadataPath}`);
      process.exit(1);
    }
    
    console.log(`\n${COLORS.cyan}Descargando desde:${COLORS.reset}`);
    console.log(`  ${COLORS.dim}${downloadUrl}${COLORS.reset}\n`);
    
    await downloadFile(downloadUrl, geojsonPath);
    
    const stats = fs.statSync(geojsonPath);
    console.log(`\n${COLORS.green}✓ GeoJSON descargado: ${formatBytes(stats.size)}${COLORS.reset}`);
    console.log(`  Guardado en: ${geojsonPath}`);
    
    // PASO 3: Analizar asset
    logSection('PASO 3: ANÁLISIS DEL ASSET');
    
    const analysis = analyzeMapAsset(geojsonPath);
    displayAnalysis(analysis);
    
    // PASO 4: Resumen final
    logSection('RESUMEN FINAL');
    
    console.log(`${COLORS.bold}Archivos generados:${COLORS.reset}`);
    console.log(`  📄 Metadata:  ${metadataPath}`);
    console.log(`  📄 GeoJSON:   ${geojsonPath} (${formatBytes(analysis.fileSize)})`);
    
    console.log(`\n${COLORS.bold}Resultado del análisis:${COLORS.reset}`);
    console.log(`  • Features:   ${analysis.featureCount}`);
    console.log(`  • Formato:    ${analysis.format}`);
    console.log(`  • ADM2:       ${analysis.isADM2 ? COLORS.green + '✓ SÍ' + COLORS.reset : COLORS.yellow + '? No claro' + COLORS.reset}`);
    
    // Mostrar resultados de búsqueda
    const searchResults = analysis.searchResults;
    const castellonFound = searchResults['Castellón'].exact.length > 0 || searchResults['Castelló'].exact.length > 0;
    const teruelFound = searchResults['Teruel'].exact.length > 0;
    
    console.log(`  • Castellón:  ${castellonFound ? COLORS.green + '✓ Encontrado' + COLORS.reset : COLORS.red + '✗ No encontrado' + COLORS.reset}`);
    console.log(`  • Teruel:     ${teruelFound ? COLORS.green + '✓ Encontrado' + COLORS.reset : COLORS.red + '✗ No encontrado' + COLORS.reset}`);
    
    if (licenseInfo) {
      console.log(`\n${COLORS.bold}Licencia/atribución:${COLORS.reset}`);
      console.log(`  ${COLORS.dim}${licenseInfo.attribution}${COLORS.reset}`);
    }
    
    console.log(`\n${COLORS.green}${COLORS.bold}✓ Proceso completado exitosamente${COLORS.reset}\n`);
    
  } catch (error) {
    console.error(`\n${COLORS.red}${COLORS.bold}✗ ERROR:${COLORS.reset} ${error}\n`);
    
    // Información de diagnóstico
    console.log(`${COLORS.yellow}Información de diagnóstico:${COLORS.reset}`);
    console.log(`  APIs consultadas:`);
    CONFIG.apiUrls.forEach(url => console.log(`    - ${url}`));
    console.log(`  País: ${CONFIG.country}`);
    console.log(`  Nivel: ${CONFIG.admLevel}`);
    
    if (fs.existsSync(metadataPath)) {
      console.log(`\nMetadata parcial guardada en: ${metadataPath}`);
    }
    
    // Limpiar archivos corruptos
    if (fs.existsSync(geojsonPath)) {
      const stats = fs.statSync(geojsonPath);
      if (stats.size < 1000) { // Probablemente un error HTML
        fs.unlinkSync(geojsonPath);
        console.log(`\n${COLORS.yellow}⚠ Archivo corrupto eliminado: ${CONFIG.geojsonFile}${COLORS.reset}`);
      }
    }
    
    process.exit(1);
  }
}

main();