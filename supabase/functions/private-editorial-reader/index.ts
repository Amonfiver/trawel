/**
 * Private editorial reader.
 *
 * This is deliberately the only API that exposes unpublished editorial drafts
 * to a browser. It validates a real Supabase Auth session and an explicit
 * editorial_reader_roles allow-list server-side before querying with service role.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

type EditorialRole = 'editor' | 'admin';

interface ReaderRequest {
  locationId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('authorization');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('private-editorial-reader: Supabase configuration is missing');
    return jsonResponse({ error: 'Private reader is not configured.' }, 500);
  }

  const token = getBearerToken(authorization);
  if (!token) {
    return jsonResponse({ error: 'Authentication is required.' }, 401);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);

  if (userError || !userData.user) {
    return jsonResponse({ error: 'Authentication is required.' }, 401);
  }

  const body = await readJson(request);
  if (!isReaderRequest(body)) {
    return jsonResponse({ error: 'A valid locationId is required.' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: roleRow, error: roleError } = await adminClient
    .from('editorial_reader_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('status', 'active')
    .in('role', ['editor', 'admin'])
    .maybeSingle();

  if (roleError) {
    console.error('private-editorial-reader: role lookup failed', roleError.message);
    return jsonResponse({ error: 'Private reader is not available.' }, 500);
  }

  if (!roleRow || !isEditorialRole(roleRow.role)) {
    return jsonResponse({ error: 'You do not have editorial reader access.' }, 403);
  }

  const { data: location, error: locationError } = await adminClient
    .from('location_cities')
    .select('id,country_slug,name,slug,region,status')
    .eq('id', body.locationId)
    .maybeSingle();

  if (locationError) {
    console.error('private-editorial-reader: location lookup failed', locationError.message);
    return jsonResponse({ error: 'Private reader is not available.' }, 500);
  }

  if (!location) {
    return jsonResponse({ error: 'Destination not found.' }, 404);
  }

  const { data: drafts, error: draftsError } = await adminClient
    .from('editorial_contents')
    .select([
      'id',
      'entity_type',
      'entity_id',
      'entity_slug',
      'country_slug',
      'zone_slug',
      'mode',
      'headline',
      'intro',
      'what_makes_special',
      'highlights',
      'suggested_route',
      'practical_tips',
      'sections',
      'sources',
      'metadata',
      'status',
      'review_state',
      'published_at',
      'updated_at',
    ].join(','))
    .eq('entity_type', 'zone')
    .eq('entity_id', body.locationId)
    .eq('status', 'draft')
    .in('mode', ['adventure', 'student'])
    .order('mode');

  if (draftsError) {
    console.error('private-editorial-reader: draft lookup failed', draftsError.message);
    return jsonResponse({ error: 'Private reader is not available.' }, 500);
  }

  return jsonResponse({
    destination: location,
    role: roleRow.role,
    drafts: drafts || [],
  });
});

function getBearerToken(value: string | null): string | null {
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function isReaderRequest(value: unknown): value is ReaderRequest {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'locationId' in value &&
      typeof value.locationId === 'string' &&
      UUID_PATTERN.test(value.locationId)
  );
}

function isEditorialRole(value: unknown): value is EditorialRole {
  return value === 'editor' || value === 'admin';
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
