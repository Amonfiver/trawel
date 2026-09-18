begin;

select plan(21);

insert into editorial_destination_mappings (
  id, source_mapping_id, canonical_destination_id,
  trawel_entity_type, trawel_entity_id, trawel_entity_slug, country_slug, zone_slug, status
) values (
  '10000000-0000-4000-8000-000000000001', 'test-profile-traceability', 'investighost:test:profile-traceability',
  'zone', 'traceability-zone', 'traceability-zone', 'spain', 'traceability-zone', 'active'
);

insert into editorial_deliveries (
  id, schema_version, handoff_key, payload_fingerprint, source_mapping_id,
  canonical_destination_id, library_entry_id, version_hash, content_hash, payload, status
) values (
  '20000000-0000-4000-8000-000000000001', 'v2', 'profile-traceability-test-001', repeat('f', 64), 'test-profile-traceability',
  'investighost:test:profile-traceability', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', repeat('a', 64), repeat('c', 64),
  $payload$
  {
    "schemaVersion":"v2",
    "handoffKey":"profile-traceability-test-001",
    "payloadFingerprint":"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "mappingId":"test-profile-traceability",
    "canonicalDestinationId":"investighost:test:profile-traceability",
    "libraryEntryId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "versionHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "contentHash":"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    "provenance":{"source":"derived","versionId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","revisionId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab","anchoredProfile":"adventure"},
    "approval":{"kind":"library_version","decisionId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac"},
    "profiles":{
      "adventure":{"headline":"Adventure trace","metadata":{"investighost":{"profile":"adventure","libraryEntryId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","currentApproved":{"source":"derived","versionId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab","revisionId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac","versionHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","contentHash":"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc","originVersionHash":"dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd","approvalDecisionId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaad","approvedAt":"2026-09-14T10:00:00.000Z"}}}},
      "student":{"headline":"Student trace","metadata":{"investighost":{"profile":"student","libraryEntryId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","currentApproved":{"source":"derived","versionId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc","revisionId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd","versionHash":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","contentHash":"eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","originVersionHash":"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff","approvalDecisionId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbe","approvedAt":"2026-09-14T10:00:00.000Z"}}}}
    }
  }
  $payload$::jsonb,
  'received'
);

select is(
  (select ingest_editorial_delivery_v2(
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    payload
  )->>'status' from editorial_deliveries where id = '20000000-0000-4000-8000-000000000001'),
  'accepted',
  'accepts the delivery atomically'
);

select is((select count(*)::integer from editorial_contents where metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 2, 'creates exactly two available profiles');
select is((select metadata #>> '{ingress,library_entry_id}' from editorial_contents where mode = 'adventure' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'adventure ingress keeps Adventure entry');
select is((select metadata #>> '{ingress,library_entry_id}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'student ingress keeps Student entry');
select is((select metadata #>> '{ingress,version_hash}' from editorial_contents where mode = 'adventure' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), repeat('a', 64), 'adventure ingress keeps Adventure version hash');
select is((select metadata #>> '{ingress,version_hash}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), repeat('b', 64), 'student ingress keeps Student version hash');
select is((select metadata #>> '{ingress,content_hash}' from editorial_contents where mode = 'adventure' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), repeat('c', 64), 'adventure ingress keeps Adventure content hash');
select is((select metadata #>> '{ingress,content_hash}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), repeat('e', 64), 'student ingress keeps Student content hash');
select is((select metadata #>> '{approval,decisionId}' from editorial_contents where mode = 'adventure' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaad', 'adventure approval is profile-specific');
select is((select metadata #>> '{approval,decisionId}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbe', 'student approval is profile-specific');
select is((select metadata #>> '{provenance,versionId}' from editorial_contents where mode = 'adventure' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab', 'adventure provenance keeps Adventure version');
select is((select metadata #>> '{provenance,versionId}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc', 'student provenance keeps Student version');
select is((select metadata #>> '{provenance,revisionId}' from editorial_contents where mode = 'adventure' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac', 'adventure provenance keeps Adventure revision');
select is((select metadata #>> '{provenance,revisionId}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd', 'student provenance keeps Student revision');
select isnt(
  (select metadata #>> '{ingress,library_entry_id}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'),
  (select metadata #>> '{ingress,library_entry_id}' from editorial_contents where mode = 'adventure' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'),
  'student ingress entry differs from Adventure when supplied differently'
);
select is((select metadata #>> '{ingress,handoff_key}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'profile-traceability-test-001', 'handoff key remains shared');
select is((select metadata #>> '{ingress,payload_fingerprint}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), repeat('f', 64), 'payload fingerprint remains shared');
select is((select metadata #>> '{ingress,mapping_id}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'test-profile-traceability', 'mapping remains shared');
select is((select metadata #>> '{ingress,canonical_destination_id}' from editorial_contents where mode = 'student' and metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001'), 'investighost:test:profile-traceability', 'canonical destination remains shared');
select is((select count(*)::integer from editorial_contents where metadata #>> '{ingress,handoff_key}' = 'profile-traceability-test-001' and status = 'published' and review_state = 'approved_by_investighost' and published_at is not null), 2, 'both approved profiles are directly available to Trawel');
select is(
  (select ingest_editorial_delivery_v2(
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    payload
  )->>'idempotent' from editorial_deliveries where id = '20000000-0000-4000-8000-000000000001'),
  'true',
  'replay stays idempotent'
);

select * from finish();
rollback;
