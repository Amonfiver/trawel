/**
 * Edge Function: internal-editorial-deliveries
 *
 * Receiver privado para handoffs editoriales V2 de Investighost.
 * Requiere el secret INTERNAL_EDITORIAL_DELIVERIES_SECRET en Supabase secrets.
 * No se invoca desde el frontend y nunca publica contenido: solo crea drafts.
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
}

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
    publication: 'draft_only',
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
    await markDeliveryFailed(supabase, deliveryRow.id, 'atomic_ingest_failed', 'The draft transaction did not complete.');
    return jsonResponse(
      {
        success: false,
        status: 'failed',
        error: 'Draft creation failed; no profile was partially published.',
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

  return {
    valid: true,
    data: {
      ...value,
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
    },
  };
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
      metadata: value.metadata as Record<string, unknown> | undefined,
    },
  };
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
