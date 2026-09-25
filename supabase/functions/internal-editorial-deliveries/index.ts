/**
 * Edge Function: internal-editorial-deliveries
 *
 * Receiver privado para handoffs editoriales V2 de Investighost.
 * Requiere el secret INTERNAL_EDITORIAL_DELIVERIES_SECRET en Supabase secrets.
 * No se invoca desde el frontend. Investighost ya entrega contenido aprobado,
 * que queda disponible para el lector público normal de Trawel.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

type SupabaseClient = ReturnType<typeof createClient>;
type ProfileMode = 'adventure' | 'student';
type DeliveryStatus = 'received' | 'processing' | 'accepted' | 'partial' | 'rejected' | 'failed';

interface EditorialProfile {
  headline: string;
  intro?: string;
  whatMakesSpecial?: string;
  highlights?: string[];
  suggestedRoute?: string;
  practicalTips?: string[];
  sections?: unknown[];
  sources?: unknown[];
  metadata?: Record<string, unknown>;
  document?: StudentDocumentV1;
}

interface StudentDocumentV1 { version: 'student-document-v1'; headline: string; lead: string[]; blocks: StudentDocumentBlock[]; }
type StudentDocumentBlock = Record<string, unknown>;

interface EditorialDeliveryV2 {
  [key: string]: unknown;
  schemaVersion: 'v2';
  handoffKey: string;
  payloadFingerprint: string;
  mappingId: string;
  canonicalDestinationId: string;
  libraryEntryId: string;
  versionHash: string;
  contentHash: string;
  provenance: Record<string, unknown>;
  approval: Record<string, unknown>;
  profiles: Record<ProfileMode, EditorialProfile>;
  presentationPackage?: PresentationPackage;
}

type PresentationTone = 'IMPACT' | 'ADVENTURE' | 'CULTURE' | 'LANDSCAPE' | 'FOOD' | 'LOCAL_LIFE' | 'NIGHT' | 'CALM' | 'PREMIUM';
type TextPlacement = 'OVERLAY' | 'BELOW_MEDIA' | 'CARD_OVERLAY' | 'INLINE';
type PlaceCategory = 'STAY' | 'EAT' | 'DRINK' | 'NIGHTLIFE';

interface EditorialCta {
  label: string;
  actionType: 'ANCHOR' | 'INTERNAL_ROUTE' | 'EXTERNAL_URL';
  target: string;
}

interface PresentationHero {
  trawelMediaId: string;
  title: string;
  shortCopy: string;
  presentationTone: PresentationTone;
  textPlacement: TextPlacement;
  kicker?: string;
  caption?: string;
  cta?: EditorialCta;
  mode?: 'adventure' | 'student' | 'both';
}

interface VisualStoryItem extends Omit<PresentationHero, 'title' | 'shortCopy'> {
  order: number;
  title?: string;
  shortCopy?: string;
  linkedAdventureSection?: string;
}

interface PlaceToGoItem {
  category: PlaceCategory;
  name: string;
  order: number;
  shortDescription: string;
  reasonToGo: string;
  trawelMediaId?: string;
  area?: string;
  caption?: string;
  presentationTone?: PresentationTone;
  address?: string;
  url?: string;
  latitude?: number;
  longitude?: number;
}

interface PresentationPackage {
  hero: PresentationHero;
  destinationVisualStory: VisualStoryItem[];
  placesToGo: PlaceToGoItem[];
}

interface MediaUploadMetadata {
  expectedChecksum: string;
  entityType: 'country' | 'zone' | 'place' | 'route' | 'plan' | 'static_page' | 'promotion' | 'generic';
  entityId?: string;
  entitySlug?: string;
  countrySlug?: string;
  zoneSlug?: string;
  alt: string;
  defaultCaption?: string;
  credit: string;
  source: string;
  license?: string;
  rightsStatus: 'APPROVED_FOR_PUBLIC_USE';
  focalPoint?: { x: number; y: number };
}

interface EditorialDeliveryRow {
  id: string;
  handoff_key: string;
  payload_fingerprint: string;
  source_mapping_id: string;
  canonical_destination_id: string;
  mapping_id: string | null;
  status: DeliveryStatus;
  result: Record<string, unknown>;
  error_code: string | null;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}

interface EditorialMappingRow {
  id: string;
  source_mapping_id: string;
  canonical_destination_id: string;
  status: 'active' | 'inactive' | 'archived';
}

const INTERNAL_SECRET_HEADER = 'x-internal-editorial-secret';
const HANDOFF_KEY_PATTERN = /^[A-Za-z0-9._:-]{16,200}$/;
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/;
const IDENTIFIER_MAX_LENGTH = 200;
const PROFILE_MODES: ProfileMode[] = ['adventure', 'student'];
const PRESENTATION_TONES = new Set<PresentationTone>(['IMPACT', 'ADVENTURE', 'CULTURE', 'LANDSCAPE', 'FOOD', 'LOCAL_LIFE', 'NIGHT', 'CALM', 'PREMIUM']);
const TEXT_PLACEMENTS = new Set<TextPlacement>(['OVERLAY', 'BELOW_MEDIA', 'CARD_OVERLAY', 'INLINE']);
const PLACE_CATEGORIES = new Set<PlaceCategory>(['STAY', 'EAT', 'DRINK', 'NIGHTLIFE']);
const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 12_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const secret = Deno.env.get('INTERNAL_EDITORIAL_DELIVERIES_SECRET');
  const providedSecret = req.headers.get(INTERNAL_SECRET_HEADER);

  if (!secret) {
    console.error('internal-editorial-deliveries: missing INTERNAL_EDITORIAL_DELIVERIES_SECRET');
    return jsonResponse({ success: false, error: 'Internal receiver is not configured.' }, 500);
  }

  if (!providedSecret || !(await secretsMatch(providedSecret, secret))) {
    return jsonResponse({ success: false, error: 'Unauthorized.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('internal-editorial-deliveries: missing Supabase service configuration');
    return jsonResponse({ success: false, error: 'Internal receiver is not configured.' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === 'GET') {
    const handoffKey = getHandoffKeyFromPath(req);
    if (!handoffKey || !HANDOFF_KEY_PATTERN.test(handoffKey)) {
      return jsonResponse({ success: false, error: 'A valid handoffKey path parameter is required.' }, 400);
    }

    return getDeliveryStatus(supabase, handoffKey);
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);
  }

  if (isMediaUploadRequest(req)) {
    return receiveMediaUpload(supabase, req);
  }

  const body = await readJsonBody(req);

  if (isStatusRequest(body)) {
    if (!HANDOFF_KEY_PATTERN.test(body.handoffKey)) {
      return jsonResponse({ success: false, error: 'A valid handoffKey is required.' }, 400);
    }

    return getDeliveryStatus(supabase, body.handoffKey);
  }

  const validation = validateDeliveryV2(body);
  if (!validation.valid) {
    return jsonResponse({ success: false, status: 'validation_error', error: validation.error }, 400);
  }

  return receiveDelivery(supabase, validation.data);
});

async function receiveDelivery(
  supabase: SupabaseClient,
  delivery: EditorialDeliveryV2
): Promise<Response> {
  const existing = await findDeliveryByHandoffKey(supabase, delivery.handoffKey);

  if (existing) {
    if (existing.payload_fingerprint !== delivery.payloadFingerprint) {
      await appendReceipt(supabase, existing.id, 'conflict', {
        reason: 'handoff_key_reused_with_different_payload_fingerprint',
        received_payload_fingerprint: delivery.payloadFingerprint,
      });

      return jsonResponse(
        {
          success: false,
          status: 'conflict',
          error: 'handoffKey already exists with a different payloadFingerprint.',
          delivery: toDeliveryResponse(existing),
        },
        409
      );
    }

    if (existing.status === 'accepted' || existing.status === 'partial' || existing.status === 'rejected') {
      await appendReceipt(supabase, existing.id, 'duplicate', {
        reason: 'idempotent_replay',
        existing_status: existing.status,
      });

      return jsonResponse({
        success: true,
        idempotent: true,
        delivery: toDeliveryResponse(existing),
      });
    }

    return processDelivery(supabase, existing, delivery, true);
  }

  const { data, error } = await supabase
    .from('editorial_deliveries')
    .insert({
      source_system: 'investighost',
      schema_version: delivery.schemaVersion,
      handoff_key: delivery.handoffKey,
      payload_fingerprint: delivery.payloadFingerprint,
      source_mapping_id: delivery.mappingId,
      canonical_destination_id: delivery.canonicalDestinationId,
      library_entry_id: delivery.libraryEntryId,
      version_hash: delivery.versionHash,
      content_hash: delivery.contentHash,
      payload: delivery,
      status: 'received',
    })
    .select(DELIVERY_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      const racedDelivery = await findDeliveryByHandoffKey(supabase, delivery.handoffKey);
      if (racedDelivery) {
        return receiveDelivery(supabase, delivery);
      }
    }

    console.error('internal-editorial-deliveries: insert delivery failed', error.message);
    return jsonResponse({ success: false, status: 'failed', error: 'Could not record delivery.' }, 500);
  }

  const recordedDelivery = data as unknown as EditorialDeliveryRow;
  await appendReceipt(supabase, recordedDelivery.id, 'received', {
    schema_version: delivery.schemaVersion,
    publication: 'available_to_trawel',
  });

  return processDelivery(supabase, recordedDelivery, delivery, false);
}

async function processDelivery(
  supabase: SupabaseClient,
  deliveryRow: EditorialDeliveryRow,
  delivery: EditorialDeliveryV2,
  isRetry: boolean
): Promise<Response> {
  const { data: processingData, error: processingError } = await supabase
    .from('editorial_deliveries')
    .update({
      status: 'processing',
      processed_at: null,
      error_code: null,
      error_message: null,
    })
    .eq('id', deliveryRow.id)
    .in('status', ['received', 'processing', 'failed'])
    .select(DELIVERY_COLUMNS)
    .maybeSingle();

  if (processingError || !processingData) {
    const current = await findDeliveryByHandoffKey(supabase, delivery.handoffKey);
    if (current?.status === 'accepted') {
      return jsonResponse({ success: true, idempotent: true, delivery: toDeliveryResponse(current) });
    }

    console.error('internal-editorial-deliveries: could not enter processing state', processingError?.message);
    return jsonResponse({ success: false, status: 'failed', error: 'Could not process delivery.' }, 500);
  }

  await appendReceipt(supabase, deliveryRow.id, 'processing', { retry: isRetry });

  const mapping = await findActiveMapping(supabase, delivery);

  if (!mapping) {
    await markDeliveryFailed(supabase, deliveryRow.id, 'mapping_not_found', 'Active mapping not found or does not match delivery identity.');
    return jsonResponse(
      {
        success: false,
        status: 'failed',
        error: 'No active destination mapping matches canonicalDestinationId and mappingId.',
        retryable: true,
      },
      409
    );
  }

  const { data: ingestResult, error: ingestError } = await supabase.rpc('ingest_editorial_delivery_v2', {
    p_delivery_id: deliveryRow.id,
    p_mapping_id: mapping.id,
    p_payload: delivery,
  });

  if (ingestError) {
    console.error('internal-editorial-deliveries: atomic ingest failed', ingestError.message);
    await markDeliveryFailed(supabase, deliveryRow.id, 'atomic_ingest_failed', 'The available-content transaction did not complete.');
    return jsonResponse(
      {
        success: false,
        status: 'failed',
        error: 'Content availability update failed; no profile was partially published.',
        retryable: true,
      },
      500
    );
  }

  const current = await findDeliveryByHandoffKey(supabase, delivery.handoffKey);
  return jsonResponse({
    success: true,
    idempotent: Boolean((ingestResult as { idempotent?: unknown } | null)?.idempotent),
    delivery: current ? toDeliveryResponse(current) : { id: deliveryRow.id, status: 'accepted' },
  });
}

async function getDeliveryStatus(supabase: SupabaseClient, handoffKey: string): Promise<Response> {
  const delivery = await findDeliveryByHandoffKey(supabase, handoffKey);

  if (!delivery) {
    return jsonResponse({ success: false, error: 'Delivery not found.' }, 404);
  }

  return jsonResponse({ success: true, delivery: toDeliveryResponse(delivery) });
}

async function findActiveMapping(
  supabase: SupabaseClient,
  delivery: EditorialDeliveryV2
): Promise<EditorialMappingRow | null> {
  const { data, error } = await supabase
    .from('editorial_destination_mappings')
    .select('id,source_mapping_id,canonical_destination_id,status')
    .eq('source_system', 'investighost')
    .eq('source_mapping_id', delivery.mappingId)
    .eq('canonical_destination_id', delivery.canonicalDestinationId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('internal-editorial-deliveries: mapping lookup failed', error.message);
    return null;
  }

  return (data as unknown as EditorialMappingRow | null) || null;
}

async function findDeliveryByHandoffKey(
  supabase: SupabaseClient,
  handoffKey: string
): Promise<EditorialDeliveryRow | null> {
  const { data, error } = await supabase
    .from('editorial_deliveries')
    .select(DELIVERY_COLUMNS)
    .eq('handoff_key', handoffKey)
    .maybeSingle();

  if (error) {
    console.error('internal-editorial-deliveries: delivery lookup failed', error.message);
    return null;
  }

  return (data as unknown as EditorialDeliveryRow | null) || null;
}

async function appendReceipt(
  supabase: SupabaseClient,
  deliveryId: string,
  eventType: 'received' | 'processing' | 'duplicate' | 'accepted' | 'partial' | 'rejected' | 'failed' | 'conflict',
  metadata: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('editorial_delivery_receipts').insert({
    delivery_id: deliveryId,
    event_type: eventType,
    metadata,
  });

  if (error) {
    console.error('internal-editorial-deliveries: receipt append failed', error.message);
  }
}

async function markDeliveryFailed(
  supabase: SupabaseClient,
  deliveryId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  const { error } = await supabase
    .from('editorial_deliveries')
    .update({
      status: 'failed',
      error_code: errorCode,
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
    })
    .eq('id', deliveryId)
    .eq('status', 'processing');

  if (error) {
    console.error('internal-editorial-deliveries: delivery failure update failed', error.message);
  }

  await appendReceipt(supabase, deliveryId, 'failed', { error_code: errorCode });
}

function validateDeliveryV2(
  value: unknown
): { valid: true; data: EditorialDeliveryV2 } | { valid: false; error: string } {
  if (!isPlainObject(value)) {
    return { valid: false, error: 'Body must be a JSON object.' };
  }

  if (value.schemaVersion !== 'v2') {
    return { valid: false, error: 'schemaVersion must be exactly "v2".' };
  }

  const handoffKey = requiredText(value.handoffKey);
  if (!handoffKey || !HANDOFF_KEY_PATTERN.test(handoffKey)) {
    return { valid: false, error: 'handoffKey must match the V2 key format.' };
  }

  const payloadFingerprint = requiredText(value.payloadFingerprint)?.toLowerCase();
  if (!payloadFingerprint || !SHA256_HEX_PATTERN.test(payloadFingerprint)) {
    return { valid: false, error: 'payloadFingerprint must be a lowercase SHA-256 hex digest.' };
  }

  const mappingId = requiredText(value.mappingId);
  const canonicalDestinationId = requiredText(value.canonicalDestinationId);
  const libraryEntryId = requiredText(value.libraryEntryId);
  if (!mappingId || !canonicalDestinationId || !libraryEntryId) {
    return { valid: false, error: 'mappingId, canonicalDestinationId and libraryEntryId are required.' };
  }

  const versionHash = requiredText(value.versionHash)?.toLowerCase();
  const contentHash = requiredText(value.contentHash)?.toLowerCase();
  if (!versionHash || !SHA256_HEX_PATTERN.test(versionHash) || !contentHash || !SHA256_HEX_PATTERN.test(contentHash)) {
    return { valid: false, error: 'versionHash and contentHash must be lowercase SHA-256 hex digests.' };
  }

  if (!isPlainObject(value.provenance) || !isPlainObject(value.approval)) {
    return { valid: false, error: 'provenance and approval must be JSON objects.' };
  }

  if (!isPlainObject(value.profiles)) {
    return { valid: false, error: 'profiles must be a JSON object.' };
  }

  const profiles = {} as Record<ProfileMode, EditorialProfile>;
  for (const mode of PROFILE_MODES) {
    const profileValidation = validateProfile(value.profiles[mode], mode);
    if (!profileValidation.valid) {
      return profileValidation;
    }
    profiles[mode] = profileValidation.data;
  }

  const presentationValidation = validatePresentationPackage(value.presentationPackage);
  if (!presentationValidation.valid) {
    return presentationValidation;
  }

  return {
    valid: true,
    data: {
      schemaVersion: 'v2',
      handoffKey,
      payloadFingerprint,
      mappingId,
      canonicalDestinationId,
      libraryEntryId,
      versionHash,
      contentHash,
      provenance: value.provenance,
      approval: value.approval,
      profiles,
      ...(presentationValidation.data ? { presentationPackage: presentationValidation.data } : {}),
    },
  };
}

function validatePresentationPackage(
  value: unknown
): { valid: true; data?: PresentationPackage } | { valid: false; error: string } {
  if (value === undefined) return { valid: true };
  if (!isPlainObject(value)) return { valid: false, error: 'presentationPackage must be an object.' };

  const hero = validatePresentationHero(value.hero, 'presentationPackage.hero', true);
  if (!hero.valid) return hero;
  if (!Array.isArray(value.destinationVisualStory) || value.destinationVisualStory.length === 0) {
    return { valid: false, error: 'presentationPackage.destinationVisualStory must contain at least one item.' };
  }
  if (!Array.isArray(value.placesToGo)) {
    return { valid: false, error: 'presentationPackage.placesToGo must be an array.' };
  }

  const story: VisualStoryItem[] = [];
  const storyOrders = new Set<number>();
  for (const [index, item] of value.destinationVisualStory.entries()) {
    const validItem = validatePresentationHero(item, `presentationPackage.destinationVisualStory[${index}]`, false);
    if (!validItem.valid) return validItem;
    const order = integerAtLeast((item as Record<string, unknown>).order, 0);
    if (order === null || storyOrders.has(order)) {
      return { valid: false, error: `presentationPackage.destinationVisualStory[${index}].order must be a unique non-negative integer.` };
    }
    storyOrders.add(order);
    story.push({
      ...validItem.data,
      order,
      title: optionalText((item as Record<string, unknown>).title),
      shortCopy: optionalText((item as Record<string, unknown>).shortCopy),
      linkedAdventureSection: optionalText((item as Record<string, unknown>).linkedAdventureSection),
    });
  }

  const places: PlaceToGoItem[] = [];
  const placeOrders = new Set<string>();
  for (const [index, item] of value.placesToGo.entries()) {
    const place = validatePlaceToGo(item, index);
    if (!place.valid) return place;
    const orderKey = `${place.data.category}:${place.data.order}`;
    if (placeOrders.has(orderKey)) {
      return { valid: false, error: `presentationPackage.placesToGo[${index}].order must be unique within category.` };
    }
    placeOrders.add(orderKey);
    places.push(place.data);
  }

  return { valid: true, data: { hero: hero.data, destinationVisualStory: story, placesToGo: places } };
}

function validatePresentationHero(
  value: unknown,
  path: string,
  requireCopy: boolean
): { valid: true; data: PresentationHero } | { valid: false; error: string } {
  if (!isPlainObject(value)) return { valid: false, error: `${path} must be an object.` };
  const trawelMediaId = requiredUuid(value.trawelMediaId);
  const presentationTone = typeof value.presentationTone === 'string' && PRESENTATION_TONES.has(value.presentationTone as PresentationTone)
    ? value.presentationTone as PresentationTone : undefined;
  const textPlacement = typeof value.textPlacement === 'string' && TEXT_PLACEMENTS.has(value.textPlacement as TextPlacement)
    ? value.textPlacement as TextPlacement : undefined;
  const mode = value.mode === undefined || value.mode === 'adventure' || value.mode === 'student' || value.mode === 'both'
    ? value.mode as PresentationHero['mode'] : undefined;
  const title = optionalText(value.title);
  const shortCopy = optionalText(value.shortCopy);
  const cta = validateEditorialCta(value.cta, `${path}.cta`);
  if (!trawelMediaId || !presentationTone || !textPlacement || !cta.valid || (value.mode !== undefined && !mode) || (requireCopy && (!title || !shortCopy))) {
    return { valid: false, error: `${path} requires an approved trawelMediaId, presentationTone, textPlacement${requireCopy ? ', title and shortCopy' : ''}.` };
  }
  return {
    valid: true,
    data: {
      trawelMediaId,
      ...(title ? { title } : {}),
      ...(shortCopy ? { shortCopy } : {}),
      presentationTone,
      textPlacement,
      ...(optionalText(value.kicker) ? { kicker: optionalText(value.kicker) } : {}),
      ...(optionalText(value.caption) ? { caption: optionalText(value.caption) } : {}),
      ...(cta.data ? { cta: cta.data } : {}),
      ...(mode ? { mode } : {}),
    } as PresentationHero,
  };
}

function validatePlaceToGo(value: unknown, index: number): { valid: true; data: PlaceToGoItem } | { valid: false; error: string } {
  if (!isPlainObject(value)) return { valid: false, error: `presentationPackage.placesToGo[${index}] must be an object.` };
  const category = typeof value.category === 'string' && PLACE_CATEGORIES.has(value.category as PlaceCategory)
    ? value.category as PlaceCategory : undefined;
  const name = optionalText(value.name);
  const shortDescription = optionalText(value.shortDescription);
  const reasonToGo = optionalText(value.reasonToGo);
  const order = integerAtLeast(value.order, 0);
  const trawelMediaId = value.trawelMediaId === undefined ? undefined : requiredUuid(value.trawelMediaId) || undefined;
  const url = value.url === undefined ? undefined : optionalText(value.url);
  const latitude = value.latitude === undefined ? undefined : finiteCoordinate(value.latitude, -90, 90);
  const longitude = value.longitude === undefined ? undefined : finiteCoordinate(value.longitude, -180, 180);
  const tone = value.presentationTone === undefined ? undefined : (typeof value.presentationTone === 'string' && PRESENTATION_TONES.has(value.presentationTone as PresentationTone) ? value.presentationTone as PresentationTone : undefined);
  if (!category || !name || !shortDescription || !reasonToGo || order === null || (value.trawelMediaId !== undefined && !trawelMediaId)
      || (url !== undefined && (!url || !isSafeHttpsUrl(url)))
      || (value.latitude !== undefined && latitude === null) || (value.longitude !== undefined && longitude === null)
      || (value.presentationTone !== undefined && !tone)) {
    return { valid: false, error: `presentationPackage.placesToGo[${index}] is invalid.` };
  }
  return { valid: true, data: {
    category, name, order, shortDescription, reasonToGo,
    ...(trawelMediaId ? { trawelMediaId } : {}), ...(optionalText(value.area) ? { area: optionalText(value.area) } : {}),
    ...(optionalText(value.caption) ? { caption: optionalText(value.caption) } : {}), ...(tone ? { presentationTone: tone } : {}),
    ...(optionalText(value.address) ? { address: optionalText(value.address) } : {}), ...(url ? { url } : {}),
    ...(latitude !== undefined ? { latitude } : {}), ...(longitude !== undefined ? { longitude } : {}),
  } };
}

function validateEditorialCta(value: unknown, path: string): { valid: true; data?: EditorialCta } | { valid: false; error: string } {
  if (value === undefined || value === null) return { valid: true };
  if (!isPlainObject(value)) return { valid: false, error: `${path} must be an object.` };
  const label = optionalText(value.label);
  const actionType = value.actionType;
  const target = optionalText(value.target);
  const validTarget = (actionType === 'ANCHOR' && Boolean(target && /^#[A-Za-z][A-Za-z0-9_-]*$/.test(target)))
    || (actionType === 'INTERNAL_ROUTE' && Boolean(target && /^\/[A-Za-z0-9/_?=&%.-]*$/.test(target) && !target.startsWith('//')))
    || (actionType === 'EXTERNAL_URL' && Boolean(target && isSafeHttpsUrl(target)));
  if (!label || label.length > 160 || !validTarget) return { valid: false, error: `${path} is invalid.` };
  return { valid: true, data: { label, actionType, target: target! } as EditorialCta };
}

function validateProfile(
  value: unknown,
  mode: ProfileMode
): { valid: true; data: EditorialProfile } | { valid: false; error: string } {
  if (!isPlainObject(value)) {
    return { valid: false, error: `profiles.${mode} must be a JSON object.` };
  }

  const headline = requiredText(value.headline);
  if (!headline) {
    return { valid: false, error: `profiles.${mode}.headline is required.` };
  }

  const stringArrays: Array<keyof Pick<EditorialProfile, 'highlights' | 'practicalTips'>> = [
    'highlights',
    'practicalTips',
  ];
  for (const field of stringArrays) {
    if (value[field] !== undefined && !isStringArray(value[field])) {
      return { valid: false, error: `profiles.${mode}.${field} must be an array of strings.` };
    }
  }

  if (value.sections !== undefined && !Array.isArray(value.sections)) {
    return { valid: false, error: `profiles.${mode}.sections must be an array.` };
  }

  if (value.sources !== undefined && !Array.isArray(value.sources)) {
    return { valid: false, error: `profiles.${mode}.sources must be an array.` };
  }

  if (value.metadata !== undefined && !isPlainObject(value.metadata)) {
    return { valid: false, error: `profiles.${mode}.metadata must be an object.` };
  }

  const document = value.document === undefined ? undefined : validateStudentDocumentV1(value.document);
  if (document === null) return { valid: false, error: `profiles.${mode}.document must be a valid StudentDocumentV1.` };
  if (mode !== 'student' && document !== undefined) return { valid: false, error: 'profiles.adventure.document is not supported.' };

  return {
    valid: true,
    data: {
      headline,
      intro: optionalText(value.intro),
      whatMakesSpecial: optionalText(value.whatMakesSpecial),
      highlights: value.highlights as string[] | undefined,
      suggestedRoute: optionalText(value.suggestedRoute),
      practicalTips: value.practicalTips as string[] | undefined,
      sections: value.sections as unknown[] | undefined,
      sources: value.sources as unknown[] | undefined,
      metadata: projectProfileMetadata(value.metadata),
      ...(document ? { document } : {}),
    },
  };
}

function validateStudentDocumentV1(value: unknown): StudentDocumentV1 | null | undefined {
  if (value === undefined) return undefined;
  if (!isPlainObject(value) || value.version !== 'student-document-v1' || !requiredText(value.headline) || !Array.isArray(value.lead) || !value.lead.every((item) => Boolean(requiredText(item))) || !Array.isArray(value.blocks)) return null;
  const blocks: StudentDocumentBlock[] = [];
  for (const block of value.blocks) {
    if (!isPlainObject(block) || !validateStudentBlock(block)) return null;
    blocks.push(block);
  }
  return { version: 'student-document-v1', headline: requiredText(value.headline)!, lead: (value.lead as unknown[]).map((item) => requiredText(item)!), blocks };
}

function validateStudentBlock(block: Record<string, unknown>): boolean {
  const strings = (value: unknown) => Boolean(requiredText(value));
  if (block.type === 'paragraph') return strings(block.text);
  if (block.type === 'heading') return (block.level === 2 || block.level === 3) && strings(block.text) && (block.id === undefined || strings(block.id));
  if (block.type === 'figure') return strings(block.assetId) && strings(block.alt) && (block.placement === 'INLINE' || block.placement === 'WIDE') && (block.caption === undefined || strings(block.caption));
  if (block.type === 'list') return (block.style === 'unordered' || block.style === 'ordered') && Array.isArray(block.items) && block.items.length > 0 && block.items.every(strings);
  if (block.type === 'key_facts') return (block.title === undefined || strings(block.title)) && Array.isArray(block.items) && block.items.length > 0 && block.items.every((item) => isPlainObject(item) && strings(item.label) && strings(item.value));
  if (block.type === 'callout') return (block.tone === 'NOTE' || block.tone === 'CONTEXT' || block.tone === 'DEFINITION') && strings(block.text) && (block.title === undefined || strings(block.title));
  if (block.type === 'timeline') return (block.title === undefined || strings(block.title)) && Array.isArray(block.items) && block.items.length > 0 && block.items.every((item) => isPlainObject(item) && strings(item.label) && strings(item.text));
  if (block.type === 'references') return Array.isArray(block.items) && block.items.length > 0 && block.items.every((item) => isPlainObject(item) && strings(item.title) && (item.label === undefined || strings(item.label)) && (item.source === undefined || strings(item.source)) && (item.url === undefined || (strings(item.url) && isSafeHttpsUrl(requiredText(item.url)!))));
  return false;
}

/**
 * Trawel keeps only the profile-level trace needed to identify the approved
 * version. Research, dossiers, claims, reasoning and arbitrary producer
 * metadata must remain in Investighost.
 */
function projectProfileMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!isPlainObject(value) || !isPlainObject(value.investighost)) {
    return undefined;
  }

  const investighost = value.investighost;
  const currentApproved = isPlainObject(investighost.currentApproved)
    ? investighost.currentApproved
    : undefined;
  const projectedApproved = currentApproved
    ? pickTextFields(currentApproved, [
        'source',
        'versionId',
        'revisionId',
        'versionHash',
        'contentHash',
        'originVersionHash',
        'approvalDecisionId',
        'approvedAt',
      ])
    : undefined;

  return {
    investighost: {
      ...pickTextFields(investighost, ['profile', 'libraryEntryId']),
      ...(projectedApproved && Object.keys(projectedApproved).length > 0
        ? { currentApproved: projectedApproved }
        : {}),
    },
  };
}

function pickTextFields(
  value: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((result, field) => {
    if (typeof value[field] === 'string') {
      result[field] = value[field];
    }
    return result;
  }, {});
}

function isStatusRequest(value: unknown): value is { action: 'status'; handoffKey: string } {
  return isPlainObject(value) && value.action === 'status' && typeof value.handoffKey === 'string';
}

function toDeliveryResponse(delivery: EditorialDeliveryRow) {
  return {
    id: delivery.id,
    handoffKey: delivery.handoff_key,
    canonicalDestinationId: delivery.canonical_destination_id,
    mappingId: delivery.source_mapping_id,
    status: delivery.status,
    result: delivery.result,
    errorCode: delivery.error_code,
    errorMessage: delivery.error_message,
    receivedAt: delivery.received_at,
    processedAt: delivery.processed_at,
  };
}

function getHandoffKeyFromPath(req: Request): string | null {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const functionIndex = parts.lastIndexOf('internal-editorial-deliveries');
  const rawKey = functionIndex >= 0 ? parts[functionIndex + 1] : undefined;

  if (!rawKey) {
    return null;
  }

  try {
    return decodeURIComponent(rawKey);
  } catch {
    return null;
  }
}

async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(providedDigest);
  const right = new Uint8Array(expectedDigest);
  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }

  return difference === 0;
}

async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function isMediaUploadRequest(req: Request): boolean {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const functionIndex = parts.lastIndexOf('internal-editorial-deliveries');
  return functionIndex >= 0 && parts[functionIndex + 1] === 'media';
}

async function receiveMediaUpload(supabase: SupabaseClient, req: Request): Promise<Response> {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return jsonResponse({ success: false, error: 'Media upload requires multipart/form-data.' }, 415);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonResponse({ success: false, error: 'Malformed multipart body.' }, 400);
  }
  const fileValue = form.get('file');
  const metadata = parseMediaMetadata(form.get('metadata'));
  if (!(fileValue instanceof File) || !metadata.valid) {
    return jsonResponse({ success: false, error: metadata.valid ? 'A file field is required.' : metadata.error }, 400);
  }
  if (fileValue.size < 1 || fileValue.size > MAX_MEDIA_BYTES) {
    return jsonResponse({ success: false, error: `Media must be between 1 byte and ${MAX_MEDIA_BYTES} bytes.` }, 413);
  }

  const bytes = new Uint8Array(await fileValue.arrayBuffer());
  const detected = detectImage(bytes);
  if (!detected || (fileValue.type && fileValue.type !== detected.mimeType)) {
    return jsonResponse({ success: false, error: 'Media MIME type or magic bytes are not allowed.' }, 415);
  }
  if (detected.width < 1 || detected.height < 1 || detected.width > MAX_IMAGE_DIMENSION || detected.height > MAX_IMAGE_DIMENSION) {
    return jsonResponse({ success: false, error: 'Media dimensions are outside the safe range.' }, 400);
  }
  const checksumSha256 = await sha256Hex(bytes);
  if (checksumSha256 !== metadata.data.expectedChecksum) {
    return jsonResponse({ success: false, error: 'expectedChecksum does not match uploaded bytes.' }, 409);
  }

  const { data: matching, error: matchingError } = await supabase
    .from('image_assets')
    .select('id,checksum_sha256,mime_type,byte_size,width,height,rights_status,storage_path,storage_bucket,public_url')
    .eq('checksum_sha256', checksumSha256)
    .maybeSingle();
  if (matchingError) {
    console.error('internal-editorial-deliveries: media dedupe lookup failed', matchingError.message);
    return jsonResponse({ success: false, error: 'Could not verify media dedupe.' }, 500);
  }
  if (matching) {
    if (!isCompatibleExistingMedia(matching as Record<string, unknown>, detected, bytes.byteLength, metadata.data)) {
      return jsonResponse({ success: false, error: 'Checksum is already associated with incompatible media metadata.' }, 409);
    }
    return jsonResponse({
      success: true,
      trawelMediaId: matching.id,
      checksumSha256,
      storagePath: matching.storage_path,
      publicUrl: matching.public_url || getPublicUrl(supabase, matching.storage_bucket as string, matching.storage_path as string),
      reused: true,
    });
  }

  const storagePath = `v1/by-sha256/${checksumSha256}.${detected.extension}`;
  const upload = await supabase.storage.from('destination-media').upload(storagePath, bytes, {
    contentType: detected.mimeType,
    upsert: false,
  });
  if (upload.error) {
    console.error('internal-editorial-deliveries: media upload failed', upload.error.message);
    return jsonResponse({ success: false, error: 'Could not store media bytes.' }, 500);
  }

  const publicUrl = getPublicUrl(supabase, 'destination-media', storagePath);
  const { data: inserted, error: insertError } = await supabase
    .from('image_assets')
    .insert({
      entity_type: metadata.data.entityType,
      entity_id: metadata.data.entityId || null,
      entity_slug: metadata.data.entitySlug || null,
      country_slug: metadata.data.countrySlug || null,
      zone_slug: metadata.data.zoneSlug || null,
      storage_bucket: 'destination-media',
      storage_path: storagePath,
      public_url: publicUrl,
      alt: metadata.data.alt,
      caption: metadata.data.defaultCaption || null,
      credit: metadata.data.credit,
      source: metadata.data.source,
      license: metadata.data.license || null,
      usage_type: 'gallery',
      focal_point: metadata.data.focalPoint || {},
      width: detected.width,
      height: detected.height,
      checksum_sha256: checksumSha256,
      mime_type: detected.mimeType,
      byte_size: bytes.byteLength,
      rights_status: metadata.data.rightsStatus,
      status: 'staged',
      review_state: 'approved_by_investighost',
      metadata: { ingress: 'internal-editorial-deliveries/media' },
    })
    .select('id')
    .single();
  if (insertError || !inserted) {
    console.error('internal-editorial-deliveries: media metadata insert failed', insertError?.message);
    await supabase.storage.from('destination-media').remove([storagePath]);
    return jsonResponse({ success: false, error: 'Could not persist media metadata.' }, 500);
  }

  return jsonResponse({ success: true, trawelMediaId: inserted.id, checksumSha256, storagePath, publicUrl, reused: false }, 201);
}

function parseMediaMetadata(value: FormDataEntryValue | null): { valid: true; data: MediaUploadMetadata } | { valid: false; error: string } {
  if (typeof value !== 'string') return { valid: false, error: 'metadata JSON field is required.' };
  let raw: unknown;
  try { raw = JSON.parse(value); } catch { return { valid: false, error: 'metadata must be valid JSON.' }; }
  if (!isPlainObject(raw)) return { valid: false, error: 'metadata must be an object.' };
  const expectedChecksum = requiredText(raw.expectedChecksum)?.toLowerCase();
  const entityTypes = new Set<MediaUploadMetadata['entityType']>(['country', 'zone', 'place', 'route', 'plan', 'static_page', 'promotion', 'generic']);
  const entityType = typeof raw.entityType === 'string' && entityTypes.has(raw.entityType as MediaUploadMetadata['entityType'])
    ? raw.entityType as MediaUploadMetadata['entityType'] : undefined;
  const alt = optionalText(raw.alt);
  const credit = optionalText(raw.credit);
  const source = optionalText(raw.source);
  const focalPoint = parseFocalPoint(raw.focalPoint);
  if (!expectedChecksum || !SHA256_HEX_PATTERN.test(expectedChecksum) || !entityType || !alt || !credit || !source || raw.rightsStatus !== 'APPROVED_FOR_PUBLIC_USE' || focalPoint === null) {
    return { valid: false, error: 'metadata requires approved rights, expectedChecksum, entityType, alt, credit and source.' };
  }
  return { valid: true, data: {
    expectedChecksum, entityType, alt, credit, source, rightsStatus: 'APPROVED_FOR_PUBLIC_USE',
    ...(optionalText(raw.entityId) ? { entityId: optionalText(raw.entityId) } : {}),
    ...(optionalText(raw.entitySlug) ? { entitySlug: optionalText(raw.entitySlug) } : {}),
    ...(optionalText(raw.countrySlug) ? { countrySlug: optionalText(raw.countrySlug) } : {}),
    ...(optionalText(raw.zoneSlug) ? { zoneSlug: optionalText(raw.zoneSlug) } : {}),
    ...(optionalText(raw.defaultCaption) ? { defaultCaption: optionalText(raw.defaultCaption) } : {}),
    ...(optionalText(raw.license) ? { license: optionalText(raw.license) } : {}),
    ...(focalPoint ? { focalPoint } : {}),
  } };
}

function isCompatibleExistingMedia(existing: Record<string, unknown>, image: DetectedImage, byteSize: number, metadata: MediaUploadMetadata): boolean {
  return existing.mime_type === image.mimeType
    && existing.byte_size === byteSize
    && existing.width === image.width
    && existing.height === image.height
    && existing.rights_status === metadata.rightsStatus;
}

function getPublicUrl(supabase: SupabaseClient, bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

type DetectedImage = { mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; extension: 'jpg' | 'png' | 'webp'; width: number; height: number };

function detectImage(bytes: Uint8Array): DetectedImage | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return { mimeType: 'image/png', extension: 'png', width: readUint32BE(bytes, 16), height: readUint32BE(bytes, 20) };
  }
  if (bytes.length >= 12 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return jpegDimensions(bytes);
  }
  if (bytes.length >= 30 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return webpDimensions(bytes);
  }
  return null;
}

function jpegDimensions(bytes: Uint8Array): DetectedImage | null {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > bytes.length) return null;
    const length = (bytes[offset] << 8) + bytes[offset + 1];
    if (length < 7 || offset + length > bytes.length) return null;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { mimeType: 'image/jpeg', extension: 'jpg', width: (bytes[offset + 5] << 8) + bytes[offset + 6], height: (bytes[offset + 3] << 8) + bytes[offset + 4] };
    }
    offset += length;
  }
  return null;
}

function webpDimensions(bytes: Uint8Array): DetectedImage | null {
  const chunk = ascii(bytes, 12, 4);
  if (chunk === 'VP8X' && bytes.length >= 30) {
    return { mimeType: 'image/webp', extension: 'webp', width: 1 + readUint24LE(bytes, 24), height: 1 + readUint24LE(bytes, 27) };
  }
  if (chunk === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return { mimeType: 'image/webp', extension: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8 ' && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return { mimeType: 'image/webp', extension: 'webp', width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff };
  }
  return null;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function requiredText(value: unknown): string | null {
  const text = optionalText(value);
  return text && text.length <= IDENTIFIER_MAX_LENGTH ? text : null;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const text = value.trim();
  return text || undefined;
}

function requiredUuid(value: unknown): string | null {
  const text = optionalText(value);
  return text && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text.toLowerCase()
    : null;
}

function integerAtLeast(value: unknown, minimum: number): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum ? value : null;
}

function finiteCoordinate(value: unknown, minimum: number, maximum: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum ? value : null;
}

function parseFocalPoint(value: unknown): { x: number; y: number } | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isPlainObject(value)) return null;
  const x = finiteCoordinate(value.x, 0, 1);
  const y = finiteCoordinate(value.y, 0, 1);
  return x === null || y === null ? null : { x, y };
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const DELIVERY_COLUMNS = [
  'id',
  'handoff_key',
  'payload_fingerprint',
  'source_mapping_id',
  'canonical_destination_id',
  'mapping_id',
  'status',
  'result',
  'error_code',
  'error_message',
  'received_at',
  'processed_at',
].join(',');
