-- ======================================================
-- 006_post_seed_red_ai.sql
-- Constraints / índices que dependen de catálogos ya sembrados
-- Extensión IA / n8n / RAG / Conversacional para Sistema RED
--
-- IMPORTANTE:
-- Este script NO modifica tablas existentes del sistema RED.
-- Solo crea reglas sobre tablas del schema red_ai.
--
-- Requiere:
-- - 001_schema_red_ai.sql
-- - 005_catalogos_base_red_ai.sql
-- - 002_constraints_red_ai.sql
-- ======================================================


-- ======================================================
-- 1. UNA SOLA CONVERSACIÓN ABIERTA/ACTIVA POR CANAL + IDENTIFICADOR EXTERNO
-- ======================================================
-- Objetivo:
-- Evitar que el mismo WhatsApp/chat/thread tenga múltiples conversaciones activas
-- al mismo tiempo.
--
-- Estados considerados activos:
-- - ABIERTA
-- - EN_BOT
-- - EN_HUMANO
-- - ESPERANDO_CLIENTE
-- - ESCALADA
--
-- No incluye CERRADA.

DO $$
DECLARE
  v_estado_abierta BIGINT;
  v_estado_en_bot BIGINT;
  v_estado_en_humano BIGINT;
  v_estado_esperando_cliente BIGINT;
  v_estado_escalada BIGINT;
BEGIN
  SELECT estado_conversacion_id INTO v_estado_abierta
  FROM red_ai.estado_conversacion
  WHERE codigo_estado_conversacion = 'ABIERTA';

  SELECT estado_conversacion_id INTO v_estado_en_bot
  FROM red_ai.estado_conversacion
  WHERE codigo_estado_conversacion = 'EN_BOT';

  SELECT estado_conversacion_id INTO v_estado_en_humano
  FROM red_ai.estado_conversacion
  WHERE codigo_estado_conversacion = 'EN_HUMANO';

  SELECT estado_conversacion_id INTO v_estado_esperando_cliente
  FROM red_ai.estado_conversacion
  WHERE codigo_estado_conversacion = 'ESPERANDO_CLIENTE';

  SELECT estado_conversacion_id INTO v_estado_escalada
  FROM red_ai.estado_conversacion
  WHERE codigo_estado_conversacion = 'ESCALADA';

  IF v_estado_abierta IS NULL
     OR v_estado_en_bot IS NULL
     OR v_estado_en_humano IS NULL
     OR v_estado_esperando_cliente IS NULL
     OR v_estado_escalada IS NULL THEN
    RAISE EXCEPTION 'Faltan estados activos de conversación; revisar 005_catalogos_base_red_ai.sql';
  END IF;

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_conversacion_activa_canal_identificador
     ON red_ai.conversaciones (canal_contacto_id, identificador_externo)
     WHERE identificador_externo IS NOT NULL
       AND estado_conversacion_id IN (%s, %s, %s, %s, %s)',
    v_estado_abierta,
    v_estado_en_bot,
    v_estado_en_humano,
    v_estado_esperando_cliente,
    v_estado_escalada
  );
END $$;


-- ======================================================
-- 2. UNA SOLA DERIVACIÓN ABIERTA/TOMADA POR CONVERSACIÓN
-- ======================================================
-- Objetivo:
-- Evitar duplicar derivaciones humanas activas para la misma conversación.
--
-- Estados activos:
-- - ABIERTA
-- - TOMADA
--
-- No incluye RESUELTA ni CANCELADA.

DO $$
DECLARE
  v_estado_abierta BIGINT;
  v_estado_tomada BIGINT;
BEGIN
  SELECT estado_derivacion_id INTO v_estado_abierta
  FROM red_ai.estado_derivacion
  WHERE codigo_estado_derivacion = 'ABIERTA';

  SELECT estado_derivacion_id INTO v_estado_tomada
  FROM red_ai.estado_derivacion
  WHERE codigo_estado_derivacion = 'TOMADA';

  IF v_estado_abierta IS NULL OR v_estado_tomada IS NULL THEN
    RAISE EXCEPTION 'Faltan estados activos de derivación; revisar 005_catalogos_base_red_ai.sql';
  END IF;

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_derivacion_activa_conversacion
     ON red_ai.derivaciones_humanas (conversacion_id)
     WHERE estado_derivacion_id IN (%s, %s)',
    v_estado_abierta,
    v_estado_tomada
  );
END $$;


-- ======================================================
-- 3. UNA SOLA VERSIÓN ACTIVA POR AGENTE IA
-- ======================================================
-- Objetivo:
-- Permitir historial de versiones de prompts, pero solo una versión activa
-- por cada agente.
--
-- Esta regla no depende de catálogo, pero encaja acá porque es una regla fina
-- posterior al armado base.

CREATE UNIQUE INDEX IF NOT EXISTS uq_agente_version_activa
  ON red_ai.agente_versiones (agente_ia_id)
  WHERE activo_version = TRUE;


-- ======================================================
-- 4. UNA SOLA TAREA PENDIENTE/EN_PROCESO DEL MISMO TIPO POR LEAD
-- ======================================================
-- Objetivo:
-- Evitar que n8n cree múltiples tareas iguales para el mismo lead.
--
-- Ejemplo:
-- - "Hacer seguimiento"
-- - "Validar zona"
-- - "Enviar planes"
--
-- Estados activos:
-- - PENDIENTE
-- - EN_PROCESO

DO $$
DECLARE
  v_estado_pendiente BIGINT;
  v_estado_en_proceso BIGINT;
BEGIN
  SELECT estado_tarea_id INTO v_estado_pendiente
  FROM red_ai.estado_tarea
  WHERE codigo_estado_tarea = 'PENDIENTE';

  SELECT estado_tarea_id INTO v_estado_en_proceso
  FROM red_ai.estado_tarea
  WHERE codigo_estado_tarea = 'EN_PROCESO';

  IF v_estado_pendiente IS NULL OR v_estado_en_proceso IS NULL THEN
    RAISE EXCEPTION 'Faltan estados activos de tarea; revisar 005_catalogos_base_red_ai.sql';
  END IF;

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_tarea_activa_tipo_lead
     ON red_ai.tareas_comerciales (lead_id, tipo_tarea)
     WHERE lead_id IS NOT NULL
       AND estado_tarea_id IN (%s, %s)',
    v_estado_pendiente,
    v_estado_en_proceso
  );
END $$;


-- ======================================================
-- 5. UNA SOLA TAREA PENDIENTE/EN_PROCESO DEL MISMO TIPO POR CONVERSACIÓN
-- ======================================================
-- Objetivo:
-- Evitar duplicación de tareas activas asociadas directamente a una conversación.
--
-- Esto complementa la regla por lead.

DO $$
DECLARE
  v_estado_pendiente BIGINT;
  v_estado_en_proceso BIGINT;
BEGIN
  SELECT estado_tarea_id INTO v_estado_pendiente
  FROM red_ai.estado_tarea
  WHERE codigo_estado_tarea = 'PENDIENTE';

  SELECT estado_tarea_id INTO v_estado_en_proceso
  FROM red_ai.estado_tarea
  WHERE codigo_estado_tarea = 'EN_PROCESO';

  IF v_estado_pendiente IS NULL OR v_estado_en_proceso IS NULL THEN
    RAISE EXCEPTION 'Faltan estados activos de tarea; revisar 005_catalogos_base_red_ai.sql';
  END IF;

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_tarea_activa_tipo_conversacion
     ON red_ai.tareas_comerciales (conversacion_id, tipo_tarea)
     WHERE conversacion_id IS NOT NULL
       AND estado_tarea_id IN (%s, %s)',
    v_estado_pendiente,
    v_estado_en_proceso
  );
END $$;


-- ======================================================
-- 6. UNA SOLA TAREA PENDIENTE/EN_PROCESO DEL MISMO TIPO POR CLIENTE
-- ======================================================
-- Objetivo:
-- Evitar duplicación de tareas activas para un cliente ya convertido.
--
-- Esto aplica cuando el lead ya pasó al core RED o cuando se trabaja
-- directamente con un cliente existente.

DO $$
DECLARE
  v_estado_pendiente BIGINT;
  v_estado_en_proceso BIGINT;
BEGIN
  SELECT estado_tarea_id INTO v_estado_pendiente
  FROM red_ai.estado_tarea
  WHERE codigo_estado_tarea = 'PENDIENTE';

  SELECT estado_tarea_id INTO v_estado_en_proceso
  FROM red_ai.estado_tarea
  WHERE codigo_estado_tarea = 'EN_PROCESO';

  IF v_estado_pendiente IS NULL OR v_estado_en_proceso IS NULL THEN
    RAISE EXCEPTION 'Faltan estados activos de tarea; revisar 005_catalogos_base_red_ai.sql';
  END IF;

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_tarea_activa_tipo_cliente
     ON red_ai.tareas_comerciales (cliente_id, tipo_tarea)
     WHERE cliente_id IS NOT NULL
       AND estado_tarea_id IN (%s, %s)',
    v_estado_pendiente,
    v_estado_en_proceso
  );
END $$;


-- ======================================================
-- 7. UNA SOLA RESPUESTA IA EN ESTADO GENERADA/PENDIENTE PARA UN MENSAJE
-- ======================================================
-- Objetivo:
-- Evitar que se generen múltiples respuestas pendientes para el mismo mensaje
-- antes de enviar, revisar o descartar.
--
-- Estados controlados:
-- - GENERADA
-- - PENDIENTE_REVISION

DO $$
DECLARE
  v_estado_generada BIGINT;
  v_estado_pendiente_revision BIGINT;
BEGIN
  SELECT estado_respuesta_ia_id INTO v_estado_generada
  FROM red_ai.estado_respuesta_ia
  WHERE codigo_estado_respuesta_ia = 'GENERADA';

  SELECT estado_respuesta_ia_id INTO v_estado_pendiente_revision
  FROM red_ai.estado_respuesta_ia
  WHERE codigo_estado_respuesta_ia = 'PENDIENTE_REVISION';

  IF v_estado_generada IS NULL OR v_estado_pendiente_revision IS NULL THEN
    RAISE EXCEPTION 'Faltan estados controlados de respuesta IA; revisar 005_catalogos_base_red_ai.sql';
  END IF;

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_respuesta_ia_pendiente_mensaje
     ON red_ai.respuestas_ia (mensaje_id)
     WHERE mensaje_id IS NOT NULL
       AND estado_respuesta_ia_id IN (%s, %s)',
    v_estado_generada,
    v_estado_pendiente_revision
  );
END $$;


-- ======================================================
-- 8. UNA SOLA CLASIFICACIÓN PRINCIPAL POR MENSAJE
-- ======================================================
-- Objetivo:
-- En esta V1 asumimos una clasificación principal por mensaje.
--
-- Si más adelante queremos soportar múltiples clasificaciones por mensaje
-- con distintos modelos o reintentos, convendría agregar un campo:
-- - es_principal BOOLEAN
-- - version_clasificacion INTEGER
--
-- Por ahora, lo dejamos simple.

CREATE UNIQUE INDEX IF NOT EXISTS uq_clasificacion_mensaje
  ON red_ai.clasificaciones_mensaje (mensaje_id);


-- ======================================================
-- 9. EVITAR DUPLICADOS DE DOCUMENTOS RAG ACTIVOS POR TÍTULO Y TIPO
-- ======================================================
-- Objetivo:
-- Permitir versiones históricas, pero evitar dos documentos activos con
-- mismo título y tipo.
--
-- La versión anterior debería quedar activo_documento = FALSE antes de activar
-- una nueva.

CREATE UNIQUE INDEX IF NOT EXISTS uq_rag_documento_activo_titulo_tipo
  ON red_ai.rag_documentos (
    lower(titulo_documento),
    tipo_documento_rag_id
  )
  WHERE activo_documento = TRUE;


-- ======================================================
-- 10. EVITAR DUPLICADOS DE ZONA COMERCIAL ACTIVA POR NOMBRE / LOCALIDAD / PROVINCIA
-- ======================================================
-- Objetivo:
-- Evitar que se creen zonas comerciales repetidas por errores de carga.
--
-- Se usa COALESCE para tolerar localidad/provincia nulas.

CREATE UNIQUE INDEX IF NOT EXISTS uq_zona_comercial_nombre_localidad_provincia
  ON red_ai.zonas_comerciales (
    lower(nombre_zona_comercial),
    lower(COALESCE(localidad_zona_comercial, '')),
    lower(COALESCE(provincia_zona_comercial, ''))
  );


-- ======================================================
-- 11. EVITAR DUPLICAR INTERÉS DEL MISMO LEAD EN LA MISMA ZONA
-- ======================================================
-- Objetivo:
-- Un lead puede interesarse por varias zonas, pero no debería duplicarse
-- la misma relación lead/zona cuando zona_comercial_id está informada.

CREATE UNIQUE INDEX IF NOT EXISTS uq_zona_interes_lead_zona
  ON red_ai.zona_interes_leads (lead_id, zona_comercial_id)
  WHERE zona_comercial_id IS NOT NULL;


-- ======================================================
-- 12. EVITAR DUPLICAR MENSAJES POR ID EXTERNO
-- ======================================================
-- Objetivo:
-- Si WhatsApp, Instagram, email o el canal usado devuelve un id externo
-- de mensaje, evitamos registrar dos veces el mismo mensaje dentro de una
-- conversación.
--
-- No aplica cuando id_externo_mensaje es NULL.

CREATE UNIQUE INDEX IF NOT EXISTS uq_mensaje_conversacion_id_externo
  ON red_ai.mensajes_conversacion (conversacion_id, id_externo_mensaje)
  WHERE id_externo_mensaje IS NOT NULL;


-- ======================================================
-- 13. EVITAR DUPLICAR EJECUCIONES EXTERNAS DE N8N
-- ======================================================
-- Objetivo:
-- Si n8n informa un execution id, evitar registrar la misma ejecución
-- más de una vez.
--
-- No aplica cuando ejecucion_id_externa es NULL.

CREATE UNIQUE INDEX IF NOT EXISTS uq_automatizacion_ejecucion_externa
  ON red_ai.automatizaciones_eventos (ejecucion_id_externa)
  WHERE ejecucion_id_externa IS NOT NULL;
