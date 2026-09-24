begin;

select plan(14);

insert into editorial_destination_mappings (
  id, source_mapping_id, canonical_destination_id,
  trawel_entity_type, trawel_entity_id, trawel_entity_slug, country_slug, zone_slug, status
) values (
  '30000000-0000-4000-8000-000000000001', 'test-canonical-package', 'investighost:test:canonical-package',
  'zone', 'canonical-zone', 'canonical-zone', 'spain', 'canonical-zone', 'active'
);

insert into image_assets (
  id, entity_type, entity_id, entity_slug, country_slug, zone_slug, storage_bucket, storage_path, public_url,
  alt, credit, source, usage_type, width, height, checksum_sha256, mime_type, byte_size, rights_status, status
) values
  ('40000000-0000-4000-8000-000000000001', 'zone', 'canonical-zone', 'canonical-zone', 'spain', 'canonical-zone', 'destination-media', 'v1/by-sha256/a.jpg', 'https://example.test/a.jpg', 'Hero', 'Test', 'Test', 'gallery', 800, 600, repeat('a', 64), 'image/jpeg', 100, 'APPROVED_FOR_PUBLIC_USE', 'staged'),
  ('40000000-0000-4000-8000-000000000002', 'zone', 'canonical-zone', 'canonical-zone', 'spain', 'canonical-zone', 'destination-media', 'v1/by-sha256/b.webp', 'https://example.test/b.webp', 'Story', 'Test', 'Test', 'gallery', 800, 600, repeat('b', 64), 'image/webp', 100, 'APPROVED_FOR_PUBLIC_USE', 'staged'),
  ('40000000-0000-4000-8000-000000000003', 'zone', 'canonical-zone', 'canonical-zone', 'spain', 'canonical-zone', 'destination-media', 'v1/by-sha256/c.png', 'https://example.test/c.png', 'Place', 'Test', 'Test', 'gallery', 800, 600, repeat('c', 64), 'image/png', 100, 'APPROVED_FOR_PUBLIC_USE', 'staged');

insert into editorial_deliveries (
  id, schema_version, handoff_key, payload_fingerprint, source_mapping_id, canonical_destination_id,
  library_entry_id, version_hash, content_hash, payload, status
) values (
  '50000000-0000-4000-8000-000000000001', 'v2', 'canonical-package-test-001', repeat('d', 64), 'test-canonical-package', 'investighost:test:canonical-package',
  'canonical-library-entry', repeat('e', 64), repeat('f', 64),
  $payload$
  {
    "schemaVersion":"v2","handoffKey":"canonical-package-test-001","payloadFingerprint":"dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "mappingId":"test-canonical-package","canonicalDestinationId":"investighost:test:canonical-package","libraryEntryId":"canonical-library-entry",
    "versionHash":"eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","contentHash":"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "provenance":{},"approval":{},
    "profiles":{"adventure":{"headline":"Adventure"},"student":{"headline":"Student"}},
    "presentationPackage":{
      "hero":{"trawelMediaId":"40000000-0000-4000-8000-000000000001","title":"Canonical hero","shortCopy":"Copy","presentationTone":"IMPACT","textPlacement":"OVERLAY"},
      "destinationVisualStory":[{"trawelMediaId":"40000000-0000-4000-8000-000000000002","order":0,"title":"Story","presentationTone":"CULTURE","textPlacement":"CARD_OVERLAY"}],
      "placesToGo":[{"category":"STAY","name":"Stay","order":0,"shortDescription":"Short","reasonToGo":"Reason","trawelMediaId":"40000000-0000-4000-8000-000000000003","url":"https://example.test/stay","latitude":40.4,"longitude":-3.7}]
    }
  }
  $payload$::jsonb,
  'received'
);

select is(
  (select ingest_editorial_delivery_v2('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', payload)->>'status' from editorial_deliveries where id = '50000000-0000-4000-8000-000000000001'),
  'accepted',
  'V2_EXTENDED_ACCEPTED: package is atomically accepted'
);

select is((select count(*)::integer from destination_presentation_packages where delivery_id = '50000000-0000-4000-8000-000000000001' and status = 'published'), 1, 'PACKAGE_CONSISTENCY: one published package belongs to the delivery');
select is((select count(*)::integer from editorial_contents where presentation_package_id = (select id from destination_presentation_packages where delivery_id = '50000000-0000-4000-8000-000000000001')), 2, 'PACKAGE_ATOMIC_PUBLISH: Student and Adventure share package identity');
select is((select count(*)::integer from destination_visual_selections where package_id = (select id from destination_presentation_packages where delivery_id = '50000000-0000-4000-8000-000000000001') and slot = 'HERO'), 1, 'ONE_HERO_PER_PACKAGE: one Hero selection');
select is((select count(*)::integer from destination_visual_selections where package_id = (select id from destination_presentation_packages where delivery_id = '50000000-0000-4000-8000-000000000001') and slot = 'DESTINATION_VISUAL_STORY'), 1, 'VISUAL_SELECTION_ORDER: visual story persisted in order');
select is((select count(*)::integer from destination_places_to_go where package_id = (select id from destination_presentation_packages where delivery_id = '50000000-0000-4000-8000-000000000001') and category = 'STAY'), 1, 'PLACES_CATEGORIES: allowed category persisted');
select is((select count(*)::integer from image_assets where id in ('40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000003') and status = 'published'), 3, 'MEDIA_ASSET_INSERT: staged referenced assets publish together');
select ok(exists(select 1 from pg_indexes where indexname = 'idx_image_assets_checksum_sha256_unique'), 'MEDIA_CHECKSUM_DEDUPE: checksum unique index exists');
select ok(exists(select 1 from pg_constraint where conname = 'image_assets_mime_type_check'), 'MEDIA_INVALID_MIME_REJECTED: MIME constraint exists');
select ok(exists(select 1 from pg_constraint where conname = 'image_assets_rights_status_check'), 'MEDIA_RIGHTS_REJECTED: rights constraint exists');
select ok(exists(select 1 from pg_constraint where conname = 'destination_places_to_go_category_check'), 'INVALID_PLACE_REJECTED: place category constraint exists');
select is(
  (select ingest_editorial_delivery_v2('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', payload)->>'idempotent' from editorial_deliveries where id = '50000000-0000-4000-8000-000000000001'),
  'true',
  'REPLAY_IDEMPOTENT: canonical package replay creates no duplicate'
);
select is((select count(*)::integer from destination_presentation_packages where delivery_id = '50000000-0000-4000-8000-000000000001'), 1, 'MIXED_PACKAGE_REJECTED: one delivery resolves to one package');
select ok(not exists(select 1 from destination_visual_selections selection join destination_presentation_packages package on package.id = selection.package_id where package.delivery_id = '50000000-0000-4000-8000-000000000001' and selection.slot = 'HERO' and selection.role <> 'HERO'), 'Hero role cannot diverge from canonical slot');

select * from finish();
rollback;
