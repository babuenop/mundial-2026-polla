-- Reasignar bracket_slot en los partidos de Dieciseisavos de Final
-- Run in Supabase SQL Editor

UPDATE partidos SET bracket_slot = 'D-1'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Germany'     AND equipo_visitante = 'Paraguay')
  OR (equipo_local = 'Paraguay'    AND equipo_visitante = 'Germany'));

UPDATE partidos SET bracket_slot = 'D-2'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'France'      AND equipo_visitante = 'Sweden')
  OR (equipo_local = 'Sweden'      AND equipo_visitante = 'France'));

UPDATE partidos SET bracket_slot = 'D-3'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'South Africa' AND equipo_visitante = 'Canada')
  OR (equipo_local = 'Canada'       AND equipo_visitante = 'South Africa'));

UPDATE partidos SET bracket_slot = 'D-4'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Netherlands' AND equipo_visitante = 'Morocco')
  OR (equipo_local = 'Morocco'     AND equipo_visitante = 'Netherlands'));

UPDATE partidos SET bracket_slot = 'D-5'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Portugal'    AND equipo_visitante = 'Croatia')
  OR (equipo_local = 'Croatia'     AND equipo_visitante = 'Portugal'));

UPDATE partidos SET bracket_slot = 'D-6'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Spain'       AND equipo_visitante = 'Austria')
  OR (equipo_local = 'Austria'     AND equipo_visitante = 'Spain'));

UPDATE partidos SET bracket_slot = 'D-7'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'USA'                  AND equipo_visitante = 'Bosnia & Herzegovina')
  OR (equipo_local = 'Bosnia & Herzegovina' AND equipo_visitante = 'USA'));

UPDATE partidos SET bracket_slot = 'D-8'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Belgium'     AND equipo_visitante = 'Senegal')
  OR (equipo_local = 'Senegal'     AND equipo_visitante = 'Belgium'));

UPDATE partidos SET bracket_slot = 'D-9'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Brazil'      AND equipo_visitante = 'Japan')
  OR (equipo_local = 'Japan'       AND equipo_visitante = 'Brazil'));

UPDATE partidos SET bracket_slot = 'D-10'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Ivory Coast' AND equipo_visitante = 'Norway')
  OR (equipo_local = 'Norway'      AND equipo_visitante = 'Ivory Coast'));

UPDATE partidos SET bracket_slot = 'D-11'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Mexico'      AND equipo_visitante = 'Ecuador')
  OR (equipo_local = 'Ecuador'     AND equipo_visitante = 'Mexico'));

UPDATE partidos SET bracket_slot = 'D-12'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'England'     AND equipo_visitante = 'DR Congo')
  OR (equipo_local = 'DR Congo'    AND equipo_visitante = 'England'));

UPDATE partidos SET bracket_slot = 'D-13'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Argentina'   AND equipo_visitante = 'Cape Verde')
  OR (equipo_local = 'Cape Verde'  AND equipo_visitante = 'Argentina'));

UPDATE partidos SET bracket_slot = 'D-14'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Australia'   AND equipo_visitante = 'Egypt')
  OR (equipo_local = 'Egypt'       AND equipo_visitante = 'Australia'));

UPDATE partidos SET bracket_slot = 'D-15'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Switzerland' AND equipo_visitante = 'Algeria')
  OR (equipo_local = 'Algeria'     AND equipo_visitante = 'Switzerland'));

UPDATE partidos SET bracket_slot = 'D-16'
WHERE fase = 'Dieciseisavos de Final'
AND ((equipo_local = 'Colombia'    AND equipo_visitante = 'Ghana')
  OR (equipo_local = 'Ghana'       AND equipo_visitante = 'Colombia'));

-- Verify: all 16 slots should show a match
SELECT bracket_slot, equipo_local, equipo_visitante
FROM partidos
WHERE fase = 'Dieciseisavos de Final'
ORDER BY bracket_slot;
