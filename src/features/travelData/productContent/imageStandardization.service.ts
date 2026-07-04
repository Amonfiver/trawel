export type ImageStandardizationPresetName =
  | 'heroHeader'
  | 'adventureCard'
  | 'thumbnailFuture';

export interface ImageStandardizationPreset {
  name: ImageStandardizationPresetName;
  label: string;
  maxWidth: number;
  outputMimeType: 'image/webp';
  quality: number;
}

export interface StandardizeImageOptions {
  preset?: ImageStandardizationPresetName | ImageStandardizationPreset;
  maxWidth?: number;
  outputMimeType?: 'image/webp';
  quality?: number;
  fileName?: string;
}

export interface StandardizedImageResult {
  blob: Blob;
  fileName: string;
  originalSize: number;
  outputSize: number;
  width: number;
  height: number;
  originalType: string;
  outputType: string;
}

type SupportedInputMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

const SUPPORTED_INPUT_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const IMAGE_STANDARDIZATION_PRESETS = {
  heroHeader: {
    name: 'heroHeader',
    label: 'Hero/header',
    maxWidth: 1920,
    outputMimeType: 'image/webp',
    quality: 0.82,
  },
  adventureCard: {
    name: 'adventureCard',
    label: 'Aventura/card',
    maxWidth: 1400,
    outputMimeType: 'image/webp',
    quality: 0.8,
  },
  thumbnailFuture: {
    name: 'thumbnailFuture',
    label: 'Miniatura futura',
    maxWidth: 800,
    outputMimeType: 'image/webp',
    quality: 0.78,
  },
} satisfies Record<ImageStandardizationPresetName, ImageStandardizationPreset>;

export async function standardizeImageFile(
  file: File,
  options: StandardizeImageOptions = {}
): Promise<StandardizedImageResult> {
  if (!isSupportedInputType(file.type)) {
    throw new Error('Formato de imagen no admitido. Usa JPG, PNG o WebP.');
  }

  const preset = resolvePreset(options.preset);
  const maxWidth = normalizePositiveInteger(options.maxWidth) || preset.maxWidth;
  const outputMimeType = options.outputMimeType || preset.outputMimeType;
  const quality = normalizeQuality(options.quality ?? preset.quality);
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const dimensions = getTargetDimensions(image.naturalWidth, image.naturalHeight, maxWidth);
  const canvas = document.createElement('canvas');

  if (!canvas.getContext) {
    throw new Error('El navegador no permite procesar imagenes con canvas.');
  }

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('No se pudo preparar el canvas para procesar la imagen.');
  }

  context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

  const blob = await canvasToBlob(canvas, outputMimeType, quality);

  return {
    blob,
    fileName: createStandardizedFileName(options.fileName || file.name, outputMimeType),
    originalSize: file.size,
    outputSize: blob.size,
    width: dimensions.width,
    height: dimensions.height,
    originalType: file.type,
    outputType: blob.type || outputMimeType,
  };
}

export function getPresetForContributionType(
  contributionType: string | null | undefined
): ImageStandardizationPreset {
  switch (contributionType) {
    case 'foto_encabezado':
    case 'foto_de_encabezado':
    case 'hero':
    case 'header':
      return IMAGE_STANDARDIZATION_PRESETS.heroHeader;

    case 'thumbnail':
    case 'miniatura':
    case 'thumbnail_future':
      return IMAGE_STANDARDIZATION_PRESETS.thumbnailFuture;

    case 'foto_ciudad_zona':
    case 'foto_de_ciudad_zona':
    case 'experiencia_aventura':
    case 'experiencia':
    case 'aventura':
    default:
      return IMAGE_STANDARDIZATION_PRESETS.adventureCard;
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  const decimals = unitIndex === 0 ? 0 : 1;

  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

export function createStandardizedFileName(
  originalName: string,
  outputMimeType: 'image/webp' = 'image/webp'
): string {
  const extension = getExtensionForMimeType(outputMimeType);
  const baseName = originalName
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${baseName || 'trawel-image'}-web.${extension}`;
}

function resolvePreset(
  preset: StandardizeImageOptions['preset']
): ImageStandardizationPreset {
  if (!preset) {
    return IMAGE_STANDARDIZATION_PRESETS.adventureCard;
  }

  if (typeof preset === 'string') {
    return IMAGE_STANDARDIZATION_PRESETS[preset];
  }

  return preset;
}

function isSupportedInputType(type: string): type is SupportedInputMimeType {
  return SUPPORTED_INPUT_TYPES.has(type);
}

function normalizePositiveInteger(value: number | undefined): number | null {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return null;
  }

  return Math.trunc(value);
}

function normalizeQuality(value: number): number {
  if (!Number.isFinite(value)) {
    return IMAGE_STANDARDIZATION_PRESETS.adventureCard.quality;
  }

  return Math.min(Math.max(value, 0.1), 1);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo de imagen.'));
    };

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('El archivo de imagen no devolvio datos validos.'));
        return;
      }

      resolve(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onerror = () => {
      reject(new Error('No se pudo cargar la imagen en el navegador.'));
    };

    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('La imagen no tiene dimensiones validas.'));
        return;
      }

      resolve(image);
    };

    image.src = dataUrl;
  });
}

function getTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth) {
    return {
      width: originalWidth,
      height: originalHeight,
    };
  }

  const scale = maxWidth / originalWidth;

  return {
    width: maxWidth,
    height: Math.max(1, Math.round(originalHeight * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  outputMimeType: 'image/webp',
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo convertir la imagen a formato WebP.'));
          return;
        }

        if (blob.type !== outputMimeType) {
          reject(new Error('El navegador no pudo generar la imagen en formato WebP.'));
          return;
        }

        resolve(blob);
      },
      outputMimeType,
      quality
    );
  });
}

function getExtensionForMimeType(outputMimeType: 'image/webp'): string {
  if (outputMimeType === 'image/webp') {
    return 'webp';
  }

  return 'webp';
}
