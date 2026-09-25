import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import type { StudentDocumentMediaAsset, StudentDocumentV1 } from './studentDocument.types';

/** Resolves only the asset IDs already selected by the authoritative document. */
export async function getPublishedStudentDocumentAssets(document: StudentDocumentV1): Promise<Record<string, StudentDocumentMediaAsset>> {
  const ids = [...new Set(document.blocks.filter((block): block is Extract<typeof block, { type: 'figure' }> => block.type === 'figure').map((block) => block.assetId))];
  if (!ids.length || !isSupabaseConfigured() || !supabase) return {};
  const client = supabase;
  try {
    const { data, error } = await client.from('image_assets')
      .select('id,storage_bucket,storage_path,public_url,alt,credit,source,license,rights_status')
      .in('id', ids).eq('status', 'published').eq('rights_status', 'APPROVED_FOR_PUBLIC_USE');
    if (error) return {};
    return (data || []).reduce<Record<string, StudentDocumentMediaAsset>>((assets, row: unknown) => {
      const asset = row as Record<string, unknown>;
      const id = text(asset.id); const alt = text(asset.alt);
      const bucket = text(asset.storage_bucket); const path = text(asset.storage_path);
      const url = bucket && path ? client.storage.from(bucket).getPublicUrl(path).data.publicUrl : text(asset.public_url);
      if (id && alt && url) assets[id] = { id, url, alt, ...(text(asset.credit) ? { credit: text(asset.credit) } : {}), ...(text(asset.source) ? { source: text(asset.source) } : {}), ...(text(asset.license) ? { license: text(asset.license) } : {}) };
      return assets;
    }, {});
  } catch { return {}; }
}

function text(value: unknown): string | undefined { return typeof value === 'string' && value.trim() ? value.trim() : undefined; }
