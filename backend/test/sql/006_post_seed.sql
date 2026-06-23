-- ======================================================
-- 6. CONSTRAINTS QUE DEPENDEN DE CATÁLOGOS YA SEMBRADOS
-- (corre después de 005_catalogos_base.sql)
-- ======================================================

-- Una sola garantía ACTIVA por (instalacion, producto).
-- Las garantías ANULADAS/VENCIDAS conviven como historial, habilitando el
-- reemplazo de un equipo: se anula la vigente y se abre una nueva ACTIVA.
-- El predicado del índice parcial requiere un literal inmutable, por eso se
-- resuelve el id de 'ACTIVA' en tiempo de creación con un bloque dinámico.
DO $$
DECLARE
  v_estado_activa BIGINT;
BEGIN
  SELECT estado_garantia_id INTO v_estado_activa
  FROM estado_garantia
  WHERE descripcion_egarantia = 'ACTIVA';

  IF v_estado_activa IS NULL THEN
    RAISE EXCEPTION 'No existe estado_garantia ACTIVA; revisar 005_catalogos_base.sql';
  END IF;

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_garantia_activa_instalacion_producto '
    'ON garantia (instalacion_id, producto_id) WHERE estado_garantia_id = %s',
    v_estado_activa
  );
END $$;
