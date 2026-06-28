-- Bracket relations table + automatic winner propagation trigger
-- Run in Supabase SQL Editor

-- 1. Drop and recreate to ensure correct schema
DROP TABLE IF EXISTS bracket_relaciones CASCADE;
CREATE TABLE bracket_relaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_siguiente_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  posicion VARCHAR(10) NOT NULL CHECK (posicion IN ('local', 'visitante')),
  partido_ganador_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partido_siguiente_id, posicion)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bracket_relaciones_ganador ON bracket_relaciones(partido_ganador_id);
CREATE INDEX IF NOT EXISTS idx_bracket_relaciones_siguiente ON bracket_relaciones(partido_siguiente_id);

-- 3. Dieciseisavos → Octavos
INSERT INTO bracket_relaciones (partido_siguiente_id, posicion, partido_ganador_id)
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-1' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'D-1'  LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-1' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'D-2'  LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-2' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'D-3'  LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-2' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'D-4'  LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-3' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'D-5'  LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-3' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'D-6'  LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-4' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'D-7'  LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-4' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'D-8'  LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-5' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'D-9'  LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-5' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'D-10' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-6' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'D-11' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-6' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'D-12' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-7' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'D-13' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-7' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'D-14' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-8' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'D-15' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Octavos de Final' AND bracket_slot = 'O-8' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'D-16' LIMIT 1)
ON CONFLICT DO NOTHING;

-- 4. Octavos → Cuartos
INSERT INTO bracket_relaciones (partido_siguiente_id, posicion, partido_ganador_id)
SELECT (SELECT id FROM partidos WHERE fase = 'Cuartos de Final' AND bracket_slot = 'C-1' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'O-1' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Cuartos de Final' AND bracket_slot = 'C-1' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'O-2' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Cuartos de Final' AND bracket_slot = 'C-2' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'O-3' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Cuartos de Final' AND bracket_slot = 'C-2' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'O-4' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Cuartos de Final' AND bracket_slot = 'C-3' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'O-5' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Cuartos de Final' AND bracket_slot = 'C-3' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'O-6' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Cuartos de Final' AND bracket_slot = 'C-4' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'O-7' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Cuartos de Final' AND bracket_slot = 'C-4' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'O-8' LIMIT 1)
ON CONFLICT DO NOTHING;

-- 5. Cuartos → Semifinales (straight bracket: C-1+C-2→S-1, C-3+C-4→S-2)
INSERT INTO bracket_relaciones (partido_siguiente_id, posicion, partido_ganador_id)
SELECT (SELECT id FROM partidos WHERE fase = 'Semifinales' AND bracket_slot = 'S-1' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'C-1' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Semifinales' AND bracket_slot = 'S-1' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'C-2' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Semifinales' AND bracket_slot = 'S-2' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'C-3' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Semifinales' AND bracket_slot = 'S-2' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'C-4' LIMIT 1)
ON CONFLICT DO NOTHING;

-- 6. Semifinales → Final
INSERT INTO bracket_relaciones (partido_siguiente_id, posicion, partido_ganador_id)
SELECT (SELECT id FROM partidos WHERE fase = 'Final' AND bracket_slot = 'F-1' LIMIT 1), 'local',     (SELECT id FROM partidos WHERE bracket_slot = 'S-1' LIMIT 1) UNION ALL
SELECT (SELECT id FROM partidos WHERE fase = 'Final' AND bracket_slot = 'F-1' LIMIT 1), 'visitante', (SELECT id FROM partidos WHERE bracket_slot = 'S-2' LIMIT 1)
ON CONFLICT DO NOTHING;

-- 7. Function to determine match winner
CREATE OR REPLACE FUNCTION determinar_ganador_partido(p_partido_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_partido RECORD;
BEGIN
  SELECT equipo_local, equipo_visitante, goles_local, goles_visitante, penales_local, penales_visitante
  INTO v_partido
  FROM partidos
  WHERE id = p_partido_id;

  IF v_partido.penales_local IS NOT NULL AND v_partido.penales_visitante IS NOT NULL THEN
    IF v_partido.penales_local > v_partido.penales_visitante THEN RETURN v_partido.equipo_local; END IF;
    IF v_partido.penales_visitante > v_partido.penales_local THEN RETURN v_partido.equipo_visitante; END IF;
  END IF;

  IF v_partido.goles_local > v_partido.goles_visitante THEN RETURN v_partido.equipo_local; END IF;
  IF v_partido.goles_visitante > v_partido.goles_local THEN RETURN v_partido.equipo_visitante; END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger function: propagate winner to next bracket slot
CREATE OR REPLACE FUNCTION actualizar_bracket_siguiente()
RETURNS TRIGGER AS $$
DECLARE
  v_ganador TEXT;
  v_rel RECORD;
BEGIN
  -- Fire when finalizado becomes true, or when scores change on an already-finalized match
  IF NEW.finalizado = true AND (
    OLD.finalizado = false OR
    OLD.goles_local IS DISTINCT FROM NEW.goles_local OR
    OLD.goles_visitante IS DISTINCT FROM NEW.goles_visitante OR
    OLD.penales_local IS DISTINCT FROM NEW.penales_local OR
    OLD.penales_visitante IS DISTINCT FROM NEW.penales_visitante
  ) THEN
    v_ganador := determinar_ganador_partido(NEW.id);

    FOR v_rel IN
      SELECT partido_siguiente_id, posicion FROM bracket_relaciones
      WHERE partido_ganador_id = NEW.id
    LOOP
      IF v_rel.posicion = 'local' THEN
        UPDATE partidos SET equipo_local = v_ganador WHERE id = v_rel.partido_siguiente_id;
      ELSE
        UPDATE partidos SET equipo_visitante = v_ganador WHERE id = v_rel.partido_siguiente_id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Attach trigger
DROP TRIGGER IF EXISTS trigger_actualizar_bracket ON partidos;
CREATE TRIGGER trigger_actualizar_bracket
AFTER UPDATE ON partidos
FOR EACH ROW
EXECUTE FUNCTION actualizar_bracket_siguiente();

-- 10. RLS
ALTER TABLE bracket_relaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_bracket_relaciones" ON bracket_relaciones;
CREATE POLICY "allow_read_bracket_relaciones" ON bracket_relaciones
  FOR SELECT USING (true);

-- Verification: should return 30 rows (16 D→O + 8 O→C + 4 C→S + 2 S→F)
-- SELECT COUNT(*) FROM bracket_relaciones;
