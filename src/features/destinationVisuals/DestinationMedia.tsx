import { useState } from 'react';
import type { ResolvedDestinationVisualAsset } from './destinationVisuals.types';
import type { CanonicalDestinationMedia } from '../destinationPresentation';

type RenderableDestinationMedia = Pick<ResolvedDestinationVisualAsset, 'url' | 'alt' | 'rightsStatus' | 'referenceOnly'>
  | Pick<CanonicalDestinationMedia, 'url' | 'alt' | 'rightsStatus'>;

interface DestinationMediaProps {
  asset: RenderableDestinationMedia;
  className?: string;
  sizes: string;
  priority?: boolean;
}

/**
 * Renders a media item already selected by the destination manifest. A failed
 * request remains an explicit visual fallback instead of a broken image icon.
 */
export function DestinationMedia({ asset, className, sizes, priority = false }: DestinationMediaProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={className}
        data-media-fallback="true"
        data-reference-only={'referenceOnly' in asset && asset.referenceOnly ? 'true' : 'false'}
        data-rights-status={asset.rightsStatus}
        role="img"
        aria-label={`Imagen no disponible: ${asset.alt}`}
      />
    );
  }

  return (
    <img
      className={className}
      src={asset.url}
      alt={asset.alt}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      data-reference-only={'referenceOnly' in asset && asset.referenceOnly ? 'true' : 'false'}
      data-rights-status={asset.rightsStatus}
      onError={() => setFailed(true)}
    />
  );
}
