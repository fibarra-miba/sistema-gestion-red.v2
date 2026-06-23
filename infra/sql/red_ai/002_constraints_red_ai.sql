-- ======================================================
-- 002_constraints_red_ai.sql
-- Constraints / Relaciones / Validaciones
-- Extensión IA / n8n / RAG / Conversacional para Sistema RED
--
-- IMPORTANTE:
-- Este script NO modifica tablas existentes del sistema RED.
-- Solo agrega constraints sobre tablas del schema red_ai.
-- Las tablas public.* se referencian desde red_ai, pero no se alteran.
-- ======================================================


-- ======================================================
-- 1. CATÁLOGOS / ESTADOS
-- ======================================================

ALTER TABLE red_ai.estado_lead
  ADD CONSTRAINT uq_estado_lead_codigo
  UNIQUE (codigo_estado_lead);

ALTER TABLE red_ai.estado_conversacion
  ADD CONSTRAINT uq_estado_conversacion_codigo
  UNIQUE (codigo_estado_conversacion);

ALTER TABLE red_ai.estado_tarea
  ADD CONSTRAINT uq_estado_tarea_codigo
  UNIQUE (codigo_estado_tarea);

ALTER TABLE red_ai.estado_derivacion
  ADD CONSTRAINT uq_estado_derivacion_codigo
  UNIQUE (codigo_estado_derivacion);

ALTER TABLE red_ai.canal_contacto
  ADD CONSTRAINT uq_canal_contacto_codigo
  UNIQUE (codigo_canal_contacto);

ALTER TABLE red_ai.tipo_intencion
  ADD CONSTRAINT uq_tipo_intencion_codigo
  UNIQUE (codigo_tipo_intencion);

ALTER TABLE red_ai.tipo_documento_rag
  ADD CONSTRAINT uq_tipo_documento_rag_codigo
  UNIQUE (codigo_tipo_documento_rag);

ALTER TABLE red_ai.tipo_agente_ia
  ADD CONSTRAINT uq_tipo_agente_ia_codigo
  UNIQUE (codigo_tipo_agente_ia);

ALTER TABLE red_ai.estado_respuesta_ia
  ADD CONSTRAINT uq_estado_respuesta_ia_codigo
  UNIQUE (codigo_estado_respuesta_ia);

ALTER TABLE red_ai.estado_automatizacion
  ADD CONSTRAINT uq_estado_automatizacion_codigo
  UNIQUE (codigo_estado_automatizacion);

ALTER TABLE red_ai.estado_zona_comercial
  ADD CONSTRAINT uq_estado_zona_comercial_codigo
  UNIQUE (codigo_estado_zona_comercial);


-- ======================================================
-- 2. LEADS
-- ======================================================

ALTER TABLE red_ai.leads
  ADD CONSTRAINT fk_leads_canal_contacto
  FOREIGN KEY (canal_contacto_id)
  REFERENCES red_ai.canal_contacto(canal_contacto_id);

ALTER TABLE red_ai.leads
  ADD CONSTRAINT fk_leads_estado
  FOREIGN KEY (estado_lead_id)
  REFERENCES red_ai.estado_lead(estado_lead_id);

-- Referencia opcional hacia el core RED.
-- No modifica public.clientes.
ALTER TABLE red_ai.leads
  ADD CONSTRAINT fk_leads_cliente
  FOREIGN KEY (cliente_id)
  REFERENCES public.clientes(cliente_id);

ALTER TABLE red_ai.leads
  ADD CONSTRAINT chk_leads_score_rango
  CHECK (
    score_lead IS NULL
    OR score_lead BETWEEN 0 AND 100
  );

ALTER TABLE red_ai.leads
  ADD CONSTRAINT chk_leads_prioridad
  CHECK (
    prioridad_lead IS NULL
    OR prioridad_lead IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')
  );

ALTER TABLE red_ai.leads
  ADD CONSTRAINT chk_leads_email_formato_basico
  CHECK (
    email_lead IS NULL
    OR email_lead ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  );

ALTER TABLE red_ai.leads
  ADD CONSTRAINT chk_leads_conversion_consistente
  CHECK (
    (cliente_id IS NULL AND fecha_conversion_cliente IS NULL)
    OR
    (cliente_id IS NOT NULL AND fecha_conversion_cliente IS NOT NULL)
  );

ALTER TABLE red_ai.lead_datos_capturados
  ADD CONSTRAINT fk_lead_datos_lead
  FOREIGN KEY (lead_id)
  REFERENCES red_ai.leads(lead_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.lead_datos_capturados
  ADD CONSTRAINT chk_lead_datos_fuente
  CHECK (
    fuente_lead_dato IN ('IA', 'FORMULARIO', 'HUMANO', 'IMPORTACION', 'SISTEMA')
  );

ALTER TABLE red_ai.lead_datos_capturados
  ADD CONSTRAINT chk_lead_datos_confianza_rango
  CHECK (
    confianza_lead_dato IS NULL
    OR confianza_lead_dato BETWEEN 0 AND 100
  );


-- ======================================================
-- 3. ZONAS COMERCIALES / DEMANDA
-- ======================================================

ALTER TABLE red_ai.zonas_comerciales
  ADD CONSTRAINT fk_zonas_comerciales_estado
  FOREIGN KEY (estado_zona_comercial_id)
  REFERENCES red_ai.estado_zona_comercial(estado_zona_comercial_id);

ALTER TABLE red_ai.zonas_comerciales
  ADD CONSTRAINT chk_zonas_latitud
  CHECK (
    latitud_referencia IS NULL
    OR latitud_referencia BETWEEN -90 AND 90
  );

ALTER TABLE red_ai.zonas_comerciales
  ADD CONSTRAINT chk_zonas_longitud
  CHECK (
    longitud_referencia IS NULL
    OR longitud_referencia BETWEEN -180 AND 180
  );

ALTER TABLE red_ai.zonas_comerciales
  ADD CONSTRAINT chk_zonas_radio_positivo
  CHECK (
    radio_estimado_metros IS NULL
    OR radio_estimado_metros > 0
  );

ALTER TABLE red_ai.zona_interes_leads
  ADD CONSTRAINT fk_zona_interes_zona
  FOREIGN KEY (zona_comercial_id)
  REFERENCES red_ai.zonas_comerciales(zona_comercial_id);

ALTER TABLE red_ai.zona_interes_leads
  ADD CONSTRAINT fk_zona_interes_lead
  FOREIGN KEY (lead_id)
  REFERENCES red_ai.leads(lead_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.zona_interes_leads
  ADD CONSTRAINT chk_zona_interes_latitud
  CHECK (
    latitud_lead IS NULL
    OR latitud_lead BETWEEN -90 AND 90
  );

ALTER TABLE red_ai.zona_interes_leads
  ADD CONSTRAINT chk_zona_interes_longitud
  CHECK (
    longitud_lead IS NULL
    OR longitud_lead BETWEEN -180 AND 180
  );

ALTER TABLE red_ai.zona_interes_leads
  ADD CONSTRAINT chk_zona_interes_nivel
  CHECK (
    nivel_interes IS NULL
    OR nivel_interes IN ('BAJO', 'MEDIO', 'ALTO')
  );


-- ======================================================
-- 4. CONVERSACIONES Y MENSAJES
-- ======================================================

ALTER TABLE red_ai.conversaciones
  ADD CONSTRAINT fk_conversaciones_lead
  FOREIGN KEY (lead_id)
  REFERENCES red_ai.leads(lead_id);

-- Referencia opcional hacia el core RED.
-- No modifica public.clientes.
ALTER TABLE red_ai.conversaciones
  ADD CONSTRAINT fk_conversaciones_cliente
  FOREIGN KEY (cliente_id)
  REFERENCES public.clientes(cliente_id);

ALTER TABLE red_ai.conversaciones
  ADD CONSTRAINT fk_conversaciones_canal
  FOREIGN KEY (canal_contacto_id)
  REFERENCES red_ai.canal_contacto(canal_contacto_id);

ALTER TABLE red_ai.conversaciones
  ADD CONSTRAINT fk_conversaciones_estado
  FOREIGN KEY (estado_conversacion_id)
  REFERENCES red_ai.estado_conversacion(estado_conversacion_id);

-- Referencia opcional hacia usuarios existentes del sistema RED.
-- No modifica public.usuarios.
ALTER TABLE red_ai.conversaciones
  ADD CONSTRAINT fk_conversaciones_usuario_asignado
  FOREIGN KEY (asignado_usuario_id)
  REFERENCES public.usuarios(usuario_id);

-- La conversación debe pertenecer al menos a un lead o a un cliente.
-- Puede tener ambos cuando el lead ya se convirtió.
ALTER TABLE red_ai.conversaciones
  ADD CONSTRAINT chk_conversaciones_origen
  CHECK (
    lead_id IS NOT NULL
    OR cliente_id IS NOT NULL
  );

ALTER TABLE red_ai.mensajes_conversacion
  ADD CONSTRAINT fk_mensajes_conversacion
  FOREIGN KEY (conversacion_id)
  REFERENCES red_ai.conversaciones(conversacion_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.mensajes_conversacion
  ADD CONSTRAINT chk_mensajes_direccion
  CHECK (
    direccion_mensaje IN ('IN', 'OUT')
  );

ALTER TABLE red_ai.mensajes_conversacion
  ADD CONSTRAINT chk_mensajes_remitente_tipo
  CHECK (
    remitente_tipo IN ('LEAD', 'CLIENTE', 'BOT', 'HUMANO', 'SISTEMA')
  );


-- ======================================================
-- 5. CLASIFICACIÓN IA / INTENCIONES
-- ======================================================

ALTER TABLE red_ai.clasificaciones_mensaje
  ADD CONSTRAINT fk_clasificaciones_mensaje
  FOREIGN KEY (mensaje_id)
  REFERENCES red_ai.mensajes_conversacion(mensaje_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.clasificaciones_mensaje
  ADD CONSTRAINT fk_clasificaciones_tipo_intencion
  FOREIGN KEY (tipo_intencion_id)
  REFERENCES red_ai.tipo_intencion(tipo_intencion_id);

ALTER TABLE red_ai.clasificaciones_mensaje
  ADD CONSTRAINT chk_clasificaciones_confianza
  CHECK (
    confianza_clasificacion IS NULL
    OR confianza_clasificacion BETWEEN 0 AND 100
  );

ALTER TABLE red_ai.clasificaciones_mensaje
  ADD CONSTRAINT chk_clasificaciones_sentimiento
  CHECK (
    sentimiento_clasificacion IS NULL
    OR sentimiento_clasificacion IN ('POSITIVO', 'NEUTRAL', 'NEGATIVO')
  );

ALTER TABLE red_ai.clasificaciones_mensaje
  ADD CONSTRAINT chk_clasificaciones_urgencia
  CHECK (
    urgencia_clasificacion IS NULL
    OR urgencia_clasificacion IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')
  );


-- ======================================================
-- 6. AGENTES IA / VERSIONES
-- ======================================================

ALTER TABLE red_ai.agentes_ia
  ADD CONSTRAINT fk_agentes_tipo
  FOREIGN KEY (tipo_agente_ia_id)
  REFERENCES red_ai.tipo_agente_ia(tipo_agente_ia_id);

ALTER TABLE red_ai.agentes_ia
  ADD CONSTRAINT uq_agentes_nombre
  UNIQUE (nombre_agente_ia);

ALTER TABLE red_ai.agente_versiones
  ADD CONSTRAINT fk_agente_versiones_agente
  FOREIGN KEY (agente_ia_id)
  REFERENCES red_ai.agentes_ia(agente_ia_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.agente_versiones
  ADD CONSTRAINT uq_agente_version
  UNIQUE (agente_ia_id, version_agente);

ALTER TABLE red_ai.agente_versiones
  ADD CONSTRAINT chk_agente_version_numero
  CHECK (version_agente > 0);

ALTER TABLE red_ai.agente_versiones
  ADD CONSTRAINT chk_agente_temperatura
  CHECK (
    temperatura_default IS NULL
    OR temperatura_default BETWEEN 0 AND 2
  );

ALTER TABLE red_ai.agente_versiones
  ADD CONSTRAINT chk_agente_max_tokens
  CHECK (
    max_tokens_default IS NULL
    OR max_tokens_default > 0
  );


-- ======================================================
-- 7. RAG / DOCUMENTOS / CHUNKS / CONSULTAS
-- ======================================================

ALTER TABLE red_ai.rag_documentos
  ADD CONSTRAINT fk_rag_documentos_tipo
  FOREIGN KEY (tipo_documento_rag_id)
  REFERENCES red_ai.tipo_documento_rag(tipo_documento_rag_id);

ALTER TABLE red_ai.rag_documentos
  ADD CONSTRAINT chk_rag_documentos_version
  CHECK (version_documento > 0);

ALTER TABLE red_ai.rag_chunks
  ADD CONSTRAINT fk_rag_chunks_documento
  FOREIGN KEY (documento_id)
  REFERENCES red_ai.rag_documentos(documento_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.rag_chunks
  ADD CONSTRAINT uq_rag_chunk_documento_orden
  UNIQUE (documento_id, orden_chunk);

ALTER TABLE red_ai.rag_chunks
  ADD CONSTRAINT chk_rag_chunks_orden
  CHECK (orden_chunk > 0);

ALTER TABLE red_ai.rag_consultas
  ADD CONSTRAINT fk_rag_consultas_conversacion
  FOREIGN KEY (conversacion_id)
  REFERENCES red_ai.conversaciones(conversacion_id);

ALTER TABLE red_ai.rag_consultas
  ADD CONSTRAINT fk_rag_consultas_mensaje
  FOREIGN KEY (mensaje_id)
  REFERENCES red_ai.mensajes_conversacion(mensaje_id);

ALTER TABLE red_ai.rag_consultas
  ADD CONSTRAINT chk_rag_consultas_cantidad_chunks
  CHECK (
    cantidad_chunks_solicitados IS NULL
    OR cantidad_chunks_solicitados > 0
  );

ALTER TABLE red_ai.rag_consulta_chunks
  ADD CONSTRAINT fk_rag_consulta_chunks_consulta
  FOREIGN KEY (rag_consulta_id)
  REFERENCES red_ai.rag_consultas(rag_consulta_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.rag_consulta_chunks
  ADD CONSTRAINT fk_rag_consulta_chunks_chunk
  FOREIGN KEY (chunk_id)
  REFERENCES red_ai.rag_chunks(chunk_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.rag_consulta_chunks
  ADD CONSTRAINT chk_rag_consulta_chunks_score
  CHECK (
    score_similitud IS NULL
    OR score_similitud BETWEEN 0 AND 1
  );

ALTER TABLE red_ai.rag_consulta_chunks
  ADD CONSTRAINT chk_rag_consulta_chunks_orden
  CHECK (
    orden_resultado IS NULL
    OR orden_resultado > 0
  );


-- ======================================================
-- 8. RESPUESTAS IA
-- ======================================================

ALTER TABLE red_ai.respuestas_ia
  ADD CONSTRAINT fk_respuestas_conversacion
  FOREIGN KEY (conversacion_id)
  REFERENCES red_ai.conversaciones(conversacion_id);

ALTER TABLE red_ai.respuestas_ia
  ADD CONSTRAINT fk_respuestas_mensaje
  FOREIGN KEY (mensaje_id)
  REFERENCES red_ai.mensajes_conversacion(mensaje_id);

ALTER TABLE red_ai.respuestas_ia
  ADD CONSTRAINT fk_respuestas_agente_version
  FOREIGN KEY (agente_version_id)
  REFERENCES red_ai.agente_versiones(agente_version_id);

ALTER TABLE red_ai.respuestas_ia
  ADD CONSTRAINT fk_respuestas_estado
  FOREIGN KEY (estado_respuesta_ia_id)
  REFERENCES red_ai.estado_respuesta_ia(estado_respuesta_ia_id);

ALTER TABLE red_ai.respuestas_ia
  ADD CONSTRAINT chk_respuestas_temperatura
  CHECK (
    temperatura_usada IS NULL
    OR temperatura_usada BETWEEN 0 AND 2
  );

ALTER TABLE red_ai.respuestas_ia
  ADD CONSTRAINT chk_respuestas_tokens_input
  CHECK (
    tokens_input IS NULL
    OR tokens_input >= 0
  );

ALTER TABLE red_ai.respuestas_ia
  ADD CONSTRAINT chk_respuestas_tokens_output
  CHECK (
    tokens_output IS NULL
    OR tokens_output >= 0
  );

ALTER TABLE red_ai.respuestas_ia
  ADD CONSTRAINT fk_respuesta_ia_chunks_respuesta
  FOREIGN KEY (respuesta_ia_id)
  REFERENCES red_ai.respuestas_ia(respuesta_ia_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.respuesta_ia_chunks
  ADD CONSTRAINT fk_respuesta_ia_chunks_chunk
  FOREIGN KEY (chunk_id)
  REFERENCES red_ai.rag_chunks(chunk_id)
  ON DELETE CASCADE;

ALTER TABLE red_ai.respuesta_ia_chunks
  ADD CONSTRAINT chk_respuesta_ia_chunks_score
  CHECK (
    score_chunk IS NULL
    OR score_chunk BETWEEN 0 AND 1
  );

ALTER TABLE red_ai.respuesta_ia_chunks
  ADD CONSTRAINT chk_respuesta_ia_chunks_orden
  CHECK (
    orden_chunk_usado IS NULL
    OR orden_chunk_usado > 0
  );


-- ======================================================
-- 9. AUTOMATIZACIONES / N8N
-- ======================================================

ALTER TABLE red_ai.automatizaciones_eventos
  ADD CONSTRAINT fk_automatizaciones_estado
  FOREIGN KEY (estado_automatizacion_id)
  REFERENCES red_ai.estado_automatizacion(estado_automatizacion_id);

ALTER TABLE red_ai.automatizaciones_eventos
  ADD CONSTRAINT chk_automatizaciones_reintentos
  CHECK (reintentos >= 0);

ALTER TABLE red_ai.automatizaciones_eventos
  ADD CONSTRAINT chk_automatizaciones_fechas
  CHECK (
    finished_at IS NULL
    OR started_at IS NULL
    OR finished_at >= started_at
  );

ALTER TABLE red_ai.automatizaciones_eventos
  ADD CONSTRAINT chk_automatizaciones_entidad
  CHECK (
    entidad_tipo IS NULL
    OR entidad_tipo IN (
      'LEAD',
      'CLIENTE',
      'CONVERSACION',
      'MENSAJE',
      'PAGO',
      'INSTALACION',
      'TAREA',
      'DERIVACION',
      'RAG',
      'SISTEMA'
    )
  );


-- ======================================================
-- 10. TAREAS COMERCIALES / OPERATIVAS
-- ======================================================

ALTER TABLE red_ai.tareas_comerciales
  ADD CONSTRAINT fk_tareas_lead
  FOREIGN KEY (lead_id)
  REFERENCES red_ai.leads(lead_id);

-- Referencia opcional hacia el core RED.
-- No modifica public.clientes.
ALTER TABLE red_ai.tareas_comerciales
  ADD CONSTRAINT fk_tareas_cliente
  FOREIGN KEY (cliente_id)
  REFERENCES public.clientes(cliente_id);

ALTER TABLE red_ai.tareas_comerciales
  ADD CONSTRAINT fk_tareas_conversacion
  FOREIGN KEY (conversacion_id)
  REFERENCES red_ai.conversaciones(conversacion_id);

-- Referencia opcional hacia usuarios existentes del sistema RED.
-- No modifica public.usuarios.
ALTER TABLE red_ai.tareas_comerciales
  ADD CONSTRAINT fk_tareas_usuario
  FOREIGN KEY (usuario_id)
  REFERENCES public.usuarios(usuario_id);

ALTER TABLE red_ai.tareas_comerciales
  ADD CONSTRAINT fk_tareas_estado
  FOREIGN KEY (estado_tarea_id)
  REFERENCES red_ai.estado_tarea(estado_tarea_id);

ALTER TABLE red_ai.tareas_comerciales
  ADD CONSTRAINT chk_tareas_origen
  CHECK (
    lead_id IS NOT NULL
    OR cliente_id IS NOT NULL
    OR conversacion_id IS NOT NULL
  );

ALTER TABLE red_ai.tareas_comerciales
  ADD CONSTRAINT chk_tareas_prioridad
  CHECK (
    prioridad_tarea IS NULL
    OR prioridad_tarea IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')
  );

ALTER TABLE red_ai.tareas_comerciales
  ADD CONSTRAINT chk_tareas_fechas
  CHECK (
    fecha_vencimiento IS NULL
    OR fecha_programada IS NULL
    OR fecha_vencimiento >= fecha_programada
  );


-- ======================================================
-- 11. DERIVACIONES HUMANAS
-- ======================================================

ALTER TABLE red_ai.derivaciones_humanas
  ADD CONSTRAINT fk_derivaciones_conversacion
  FOREIGN KEY (conversacion_id)
  REFERENCES red_ai.conversaciones(conversacion_id);

ALTER TABLE red_ai.derivaciones_humanas
  ADD CONSTRAINT fk_derivaciones_lead
  FOREIGN KEY (lead_id)
  REFERENCES red_ai.leads(lead_id);

-- Referencia opcional hacia el core RED.
-- No modifica public.clientes.
ALTER TABLE red_ai.derivaciones_humanas
  ADD CONSTRAINT fk_derivaciones_cliente
  FOREIGN KEY (cliente_id)
  REFERENCES public.clientes(cliente_id);

-- Referencia opcional hacia usuarios existentes del sistema RED.
-- No modifica public.usuarios.
ALTER TABLE red_ai.derivaciones_humanas
  ADD CONSTRAINT fk_derivaciones_usuario
  FOREIGN KEY (usuario_asignado_id)
  REFERENCES public.usuarios(usuario_id);

ALTER TABLE red_ai.derivaciones_humanas
  ADD CONSTRAINT fk_derivaciones_estado
  FOREIGN KEY (estado_derivacion_id)
  REFERENCES red_ai.estado_derivacion(estado_derivacion_id);

ALTER TABLE red_ai.derivaciones_humanas
  ADD CONSTRAINT chk_derivaciones_prioridad
  CHECK (
    prioridad_derivacion IS NULL
    OR prioridad_derivacion IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')
  );

ALTER TABLE red_ai.derivaciones_humanas
  ADD CONSTRAINT chk_derivaciones_fechas_tomada
  CHECK (
    tomada_at IS NULL
    OR tomada_at >= created_at
  );

ALTER TABLE red_ai.derivaciones_humanas
  ADD CONSTRAINT chk_derivaciones_fechas_cerrada
  CHECK (
    cerrada_at IS NULL
    OR cerrada_at >= created_at
  );
