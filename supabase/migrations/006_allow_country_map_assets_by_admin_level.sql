-- 006_allow_country_map_assets_by_admin_level.sql
-- Permite múltiples assets cartográficos por país según nivel administrativo.
-- Antes country_map_assets solo permitía un registro por country_slug.
-- Ahora Trawel necesita poder conservar, por ejemplo:
--   india ADM1
--   india ADM2
--   rumania ADM1
--   rumania ADM2
-- para cambiar perfiles UX sin perder histórico ni assets anteriores.

alter table country_map_assets
drop constraint if exists country_map_assets_country_slug_key;

alter table country_map_assets
add constraint country_map_assets_country_slug_admin_level_key
unique (country_slug, admin_level);