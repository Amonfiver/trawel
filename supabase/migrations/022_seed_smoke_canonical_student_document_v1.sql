/* Local canonical smoke fixture only. No row is affected unless the pre-existing smoke handoff is present. */

UPDATE editorial_contents
SET student_document = jsonb_build_object(
    'version', 'student-document-v1',
    'headline', 'Smoke Student: lectura breve y estructurada',
    'lead', jsonb_build_array('SMOKE / DEMO / NON EDITORIAL CONTENT. Este documento breve comprueba el contrato mínimo de StudentDocumentV1.'),
    'blocks', jsonb_build_array(
        jsonb_build_object('type', 'paragraph', 'text', 'Un bloque inicial no vacío permite que el documento sea útil sin fingir una investigación más extensa.'),
        jsonb_build_object('type', 'heading', 'level', 2, 'id', 'contexto', 'text', 'Contexto'),
        jsonb_build_object('type', 'paragraph', 'text', 'La estructura conserva el orden entregado y omite de forma válida figuras, cronología, datos clave y referencias.'),
        jsonb_build_object('type', 'heading', 'level', 2, 'id', 'sintesis', 'text', 'Síntesis'),
        jsonb_build_object('type', 'paragraph', 'text', 'Trawel presenta este contenido tal como llega, sin rellenar secciones ni crear bloques vacíos.')
    )
)
WHERE mode = 'student'
  AND metadata #>> '{ingress,canonical_destination_id}' = 'smoke-canonical-destination-v1';
