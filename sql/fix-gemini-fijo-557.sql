-- fix-gemini-fijo-557.sql
-- Corrige las 18 configuraciones ORIGINALES cuya frase de plataforma dice
-- "Gemini" fijo en vez de {{PLATFORM}} (roles del censo: 187, 188, 189, 190, 191, 406, 407, 408, 409, 410).
-- Verificado por REST el 2026-09-08: son exactamente 18 items, cada uno con UNA sola
-- ocurrencia de "Gemini" (frase "You are a specialized Gemini configuration" en la linea 2)
-- y CERO {{PLATFORM}}; los otros 982 items del producto tienen exactamente un {{PLATFORM}}
-- y ninguna otra plataforma fija. Las otro_template de estos roles ya usan {{PLATFORM}}.
-- Solo toca data.config_template. No toca nombre ni otro_template.

-- ===== VERIFICACION ANTES: debe devolver 18 filas (items 331-704) =====
SELECT item_num, nombre
FROM premium_items
WHERE product_id = '656f61d7-37b2-4e9c-8cf3-67065484493c'
  AND data->>'config_template' LIKE '%You are a specialized Gemini configuration%'
ORDER BY item_num;

-- ===== VERIFICACION ANTES: debe devolver 0 (ningun Gemini fuera de esa frase) =====
SELECT count(*) AS gemini_fuera_de_frase
FROM premium_items
WHERE product_id = '656f61d7-37b2-4e9c-8cf3-67065484493c'
  AND data->>'config_template' LIKE '%Gemini%'
  AND data->>'config_template' NOT LIKE '%You are a specialized Gemini configuration%';

BEGIN;

UPDATE premium_items
SET data = jsonb_set(
  data,
  '{config_template}',
  to_jsonb(replace(
    data->>'config_template',
    $fix$You are a specialized Gemini configuration$fix$,
    $fix$You are a specialized {{PLATFORM}} configuration$fix$
  )),
  true
)
WHERE product_id = '656f61d7-37b2-4e9c-8cf3-67065484493c'
  AND item_num IN (331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 697, 698, 699, 700, 701, 702, 703, 704);

COMMIT;

-- ===== VERIFICACION DESPUES: debe devolver 0 =====
SELECT count(*) AS quedan_gemini
FROM premium_items
WHERE product_id = '656f61d7-37b2-4e9c-8cf3-67065484493c'
  AND data->>'config_template' LIKE '%Gemini%';

-- ===== VERIFICACION DESPUES: debe devolver 18 =====
SELECT count(*) AS con_platform
FROM premium_items
WHERE product_id = '656f61d7-37b2-4e9c-8cf3-67065484493c'
  AND item_num IN (331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 697, 698, 699, 700, 701, 702, 703, 704)
  AND data->>'config_template' LIKE '%You are a specialized {{PLATFORM}} configuration%';
