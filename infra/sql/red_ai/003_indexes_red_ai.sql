-- ======================================================
-- 003_indexes_red_ai.sql
-- Índices útiles
-- Extensión IA / n8n / RAG / Conversacional para Sistema RED
--
-- IMPORTANTE:
-- Este script NO modifica índices existentes del sistema RED.
-- Solo crea índices sobre tablas del schema red_ai.
-- ======================================================


-- ======================================================
-- 1. LEADS
-- ======================================================

-- Búsqueda rápida de lead por teléfono.
-- Muy usado cuando entra un mensaje por WhatsApp.
CREATE INDEX IF NOT EXISTS idx_leads_telefono
  ON red_ai.leads (telefono_lead);

-- Búsqueda rápida de lead por email.
CREATE INDEX IF NOT EXISTS idx_leads_email
  ON red_ai.leads (email_lead);

-- Leads por estado.
CREATE INDEX IF NOT EXISTS idx_leads_estado
  ON red_ai.leads (estado_lead_id);

-- Leads por canal de origen.
CREATE INDEX IF NOT EXISTS idx_leads_canal
  ON red_ai.leads (canal_contacto_id);

-- Leads vinculados a cliente real del core.
CREATE INDEX IF NOT EXISTS idx_leads_cliente_id
  ON red_ai.leads (cliente_id);

-- Leads por zona textual.
-- Útil para búsquedas simples antes de tener zonas normalizadas.
CREATE INDEX IF NOT EXISTS idx_leads_zona_interes
  ON red_ai.leads (zona_interes);

-- Leads por localidad / provincia.
CREATE INDEX IF NOT EXISTS idx_leads_localidad_provincia
  ON red_ai.leads (localidad_lead, provincia_lead);

-- Leads por prioridad y fecha.
CREATE INDEX IF NOT EXISTS idx_leads_prioridad_created
  ON red_ai.leads (prioridad_lead, created_at);

-- Leads recientes.
CREATE INDEX IF NOT EXISTS idx_leads_created_at
  ON red_ai.leads (created_at);

-- Leads pendientes de conversión.
CREATE INDEX IF NOT EXISTS idx_leads_no_convertidos
  ON red_ai.leads (estado_lead_id, created_at)
  WHERE cliente_id IS NULL;

-- Datos capturados por lead.
CREATE INDEX IF NOT EXISTS idx_lead_datos_lead
  ON red_ai.lead_datos_capturados (lead_id);

-- Datos capturados por campo.
CREATE INDEX IF NOT EXISTS idx_lead_datos_campo
  ON red_ai.lead_datos_capturados (campo_lead_dato);

-- Evita duplicar infinitamente el mismo dato capturado por lead/campo/valor.
-- No es constraint porque puede haber casos históricos repetidos, pero ayuda como referencia.
CREATE INDEX IF NOT EXISTS idx_lead_datos_lead_campo_created
  ON red_ai.lead_datos_capturados (lead_id, campo_lead_dato, created_at);


-- ======================================================
-- 2. ZONAS COMERCIALES / DEMANDA
-- ======================================================

-- Búsqueda por nombre de zona.
CREATE INDEX IF NOT EXISTS idx_zonas_comerciales_nombre
  ON red_ai.zonas_comerciales (nombre_zona_comercial);

-- Búsqueda por localidad / provincia.
CREATE INDEX IF NOT EXISTS idx_zonas_comerciales_localidad_provincia
  ON red_ai.zonas_comerciales (localidad_zona_comercial, provincia_zona_comercial);

-- Zonas por estado.
CREATE INDEX IF NOT EXISTS idx_zonas_comerciales_estado
  ON red_ai.zonas_comerciales (estado_zona_comercial_id);

-- Interesados por zona.
CREATE INDEX IF NOT EXISTS idx_zona_interes_zona
  ON red_ai.zona_interes_leads (zona_comercial_id);

-- Zonas/intereses por lead.
CREATE INDEX IF NOT EXISTS idx_zona_interes_lead
  ON red_ai.zona_interes_leads (lead_id);

-- Interés por nivel y fecha.
CREATE INDEX IF NOT EXISTS idx_zona_interes_nivel_created
  ON red_ai.zona_interes_leads (nivel_interes, created_at);


-- ======================================================
-- 3. CONVERSACIONES
-- ======================================================

-- Conversaciones por lead.
CREATE INDEX IF NOT EXISTS idx_conversaciones_lead
  ON red_ai.conversaciones (lead_id);

-- Conversaciones por cliente del core.
CREATE INDEX IF NOT EXISTS idx_conversaciones_cliente
  ON red_ai.conversaciones (cliente_id);

-- Conversaciones por canal.
CREATE INDEX IF NOT EXISTS idx_conversaciones_canal
  ON red_ai.conversaciones (canal_contacto_id);

-- Conversaciones por estado.
CREATE INDEX IF NOT EXISTS idx_conversaciones_estado
  ON red_ai.conversaciones (estado_conversacion_id);

-- Conversaciones asignadas a usuario interno.
CREATE INDEX IF NOT EXISTS idx_conversaciones_usuario_asignado
  ON red_ai.conversaciones (asignado_usuario_id);

-- Búsqueda fundamental para n8n:
-- encontrar conversación por canal + identificador externo.
CREATE INDEX IF NOT EXISTS idx_conversaciones_canal_identificador
  ON red_ai.conversaciones (canal_contacto_id, identificador_externo);

-- Conversaciones recientes / activas por último mensaje.
CREATE INDEX IF NOT EXISTS idx_conversaciones_ultimo_mensaje
  ON red_ai.conversaciones (ultimo_mensaje_at);

-- Conversaciones abiertas o con actividad reciente.
CREATE INDEX IF NOT EXISTS idx_conversaciones_estado_ultimo_mensaje
  ON red_ai.conversaciones (estado_conversacion_id, ultimo_mensaje_at);


-- ======================================================
-- 4. MENSAJES
-- ======================================================

-- Mensajes por conversación en orden temporal.
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion_created
  ON red_ai.mensajes_conversacion (conversacion_id, created_at);

-- Mensajes por dirección.
CREATE INDEX IF NOT EXISTS idx_mensajes_direccion
  ON red_ai.mensajes_conversacion (direccion_mensaje);

-- Mensajes por remitente.
CREATE INDEX IF NOT EXISTS idx_mensajes_remitente
  ON red_ai.mensajes_conversacion (remitente_tipo, remitente_id);

-- Búsqueda por ID externo del canal.
CREATE INDEX IF NOT EXISTS idx_mensajes_id_externo
  ON red_ai.mensajes_conversacion (id_externo_mensaje);

-- Últimos mensajes entrantes.
-- Muy útil para procesos de clasificación o reintentos.
CREATE INDEX IF NOT EXISTS idx_mensajes_in_created
  ON red_ai.mensajes_conversacion (created_at)
  WHERE direccion_mensaje = 'IN';


-- ======================================================
-- 5. CLASIFICACIÓN IA / INTENCIONES
-- ======================================================

-- Clasificación por mensaje.
CREATE INDEX IF NOT EXISTS idx_clasificaciones_mensaje
  ON red_ai.clasificaciones_mensaje (mensaje_id);

-- Clasificaciones por intención.
CREATE INDEX IF NOT EXISTS idx_clasificaciones_tipo_intencion
  ON red_ai.clasificaciones_mensaje (tipo_intencion_id);

-- Mensajes que requieren RAG.
CREATE INDEX IF NOT EXISTS idx_clasificaciones_requiere_rag
  ON red_ai.clasificaciones_mensaje (created_at)
  WHERE requiere_rag = TRUE;

-- Mensajes que requieren intervención humana.
CREATE INDEX IF NOT EXISTS idx_clasificaciones_requiere_humano
  ON red_ai.clasificaciones_mensaje (created_at)
  WHERE requiere_humano = TRUE;

-- Clasificaciones por urgencia.
CREATE INDEX IF NOT EXISTS idx_clasificaciones_urgencia_created
  ON red_ai.clasificaciones_mensaje (urgencia_clasificacion, created_at);

-- Clasificaciones por sentimiento.
CREATE INDEX IF NOT EXISTS idx_clasificaciones_sentimiento_created
  ON red_ai.clasificaciones_mensaje (sentimiento_clasificacion, created_at);


-- ======================================================
-- 6. AGENTES IA / VERSIONES
-- ======================================================

-- Agentes por tipo.
CREATE INDEX IF NOT EXISTS idx_agentes_tipo
  ON red_ai.agentes_ia (tipo_agente_ia_id);

-- Agentes activos.
CREATE INDEX IF NOT EXISTS idx_agentes_activos
  ON red_ai.agentes_ia (activo_agente_ia);

-- Versiones por agente.
CREATE INDEX IF NOT EXISTS idx_agente_versiones_agente
  ON red_ai.agente_versiones (agente_ia_id);

-- Versión activa por agente.
CREATE INDEX IF NOT EXISTS idx_agente_versiones_activas
  ON red_ai.agente_versiones (agente_ia_id, activo_version);


-- ======================================================
-- 7. RAG / DOCUMENTOS / CHUNKS / CONSULTAS
-- ======================================================

-- Documentos por tipo.
CREATE INDEX IF NOT EXISTS idx_rag_documentos_tipo
  ON red_ai.rag_documentos (tipo_documento_rag_id);

-- Documentos activos.
CREATE INDEX IF NOT EXISTS idx_rag_documentos_activos
  ON red_ai.rag_documentos (activo_documento);

-- Documentos por título.
CREATE INDEX IF NOT EXISTS idx_rag_documentos_titulo
  ON red_ai.rag_documentos (titulo_documento);

-- Chunks por documento.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_documento
  ON red_ai.rag_chunks (documento_id);

-- Chunks por documento y orden.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_documento_orden
  ON red_ai.rag_chunks (documento_id, orden_chunk);

-- Índice vectorial para búsqueda semántica.
-- Requiere pgvector.
-- vector_cosine_ops es apropiado si se busca por distancia coseno.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
  ON red_ai.rag_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Consultas RAG por conversación.
CREATE INDEX IF NOT EXISTS idx_rag_consultas_conversacion
  ON red_ai.rag_consultas (conversacion_id);

-- Consultas RAG por mensaje.
CREATE INDEX IF NOT EXISTS idx_rag_consultas_mensaje
  ON red_ai.rag_consultas (mensaje_id);

-- Consultas RAG recientes.
CREATE INDEX IF NOT EXISTS idx_rag_consultas_created
  ON red_ai.rag_consultas (created_at);

-- Chunks recuperados por consulta.
CREATE INDEX IF NOT EXISTS idx_rag_consulta_chunks_consulta
  ON red_ai.rag_consulta_chunks (rag_consulta_id);

-- Chunks más usados en consultas.
CREATE INDEX IF NOT EXISTS idx_rag_consulta_chunks_chunk
  ON red_ai.rag_consulta_chunks (chunk_id);

-- Orden y score de resultados por consulta.
CREATE INDEX IF NOT EXISTS idx_rag_consulta_chunks_orden_score
  ON red_ai.rag_consulta_chunks (rag_consulta_id, orden_resultado, score_similitud);


-- ======================================================
-- 8. RESPUESTAS IA
-- ======================================================

-- Respuestas por conversación.
CREATE INDEX IF NOT EXISTS idx_respuestas_ia_conversacion
  ON red_ai.respuestas_ia (conversacion_id);

-- Respuestas por mensaje origen.
CREATE INDEX IF NOT EXISTS idx_respuestas_ia_mensaje
  ON red_ai.respuestas_ia (mensaje_id);

-- Respuestas por agente/version.
CREATE INDEX IF NOT EXISTS idx_respuestas_ia_agente_version
  ON red_ai.respuestas_ia (agente_version_id);

-- Respuestas por estado.
CREATE INDEX IF NOT EXISTS idx_respuestas_ia_estado
  ON red_ai.respuestas_ia (estado_respuesta_ia_id);

-- Respuestas pendientes de revisión.
CREATE INDEX IF NOT EXISTS idx_respuestas_ia_revision
  ON red_ai.respuestas_ia (created_at)
  WHERE requiere_revision = TRUE;

-- Respuestas recientes.
CREATE INDEX IF NOT EXISTS idx_respuestas_ia_created
  ON red_ai.respuestas_ia (created_at);

-- Chunks usados por respuesta.
CREATE INDEX IF NOT EXISTS idx_respuesta_ia_chunks_respuesta
  ON red_ai.respuesta_ia_chunks (respuesta_ia_id);

-- Respuestas que usaron cierto chunk.
CREATE INDEX IF NOT EXISTS idx_respuesta_ia_chunks_chunk
  ON red_ai.respuesta_ia_chunks (chunk_id);


-- ======================================================
-- 9. AUTOMATIZACIONES / N8N
-- ======================================================

-- Eventos por workflow.
CREATE INDEX IF NOT EXISTS idx_automatizaciones_workflow
  ON red_ai.automatizaciones_eventos (nombre_workflow);

-- Eventos por workflow externo.
CREATE INDEX IF NOT EXISTS idx_automatizaciones_workflow_externo
  ON red_ai.automatizaciones_eventos (workflow_id_externo);

-- Eventos por ejecución externa.
CREATE INDEX IF NOT EXISTS idx_automatizaciones_ejecucion_externa
  ON red_ai.automatizaciones_eventos (ejecucion_id_externa);

-- Eventos por estado.
CREATE INDEX IF NOT EXISTS idx_automatizaciones_estado
  ON red_ai.automatizaciones_eventos (estado_automatizacion_id);

-- Eventos por entidad.
CREATE INDEX IF NOT EXISTS idx_automatizaciones_entidad
  ON red_ai.automatizaciones_eventos (entidad_tipo, entidad_id);

-- Eventos recientes.
CREATE INDEX IF NOT EXISTS idx_automatizaciones_created
  ON red_ai.automatizaciones_eventos (created_at);

-- Eventos fallidos o reintentables.
CREATE INDEX IF NOT EXISTS idx_automatizaciones_fallidos
  ON red_ai.automatizaciones_eventos (estado_automatizacion_id, created_at)
  WHERE error_mensaje IS NOT NULL;


-- ======================================================
-- 10. TAREAS COMERCIALES / OPERATIVAS
-- ======================================================

-- Tareas por lead.
CREATE INDEX IF NOT EXISTS idx_tareas_lead
  ON red_ai.tareas_comerciales (lead_id);

-- Tareas por cliente.
CREATE INDEX IF NOT EXISTS idx_tareas_cliente
  ON red_ai.tareas_comerciales (cliente_id);

-- Tareas por conversación.
CREATE INDEX IF NOT EXISTS idx_tareas_conversacion
  ON red_ai.tareas_comerciales (conversacion_id);

-- Tareas por usuario asignado.
CREATE INDEX IF NOT EXISTS idx_tareas_usuario
  ON red_ai.tareas_comerciales (usuario_id);

-- Tareas por estado.
CREATE INDEX IF NOT EXISTS idx_tareas_estado
  ON red_ai.tareas_comerciales (estado_tarea_id);

-- Tareas por tipo.
CREATE INDEX IF NOT EXISTS idx_tareas_tipo
  ON red_ai.tareas_comerciales (tipo_tarea);

-- Tareas por prioridad.
CREATE INDEX IF NOT EXISTS idx_tareas_prioridad
  ON red_ai.tareas_comerciales (prioridad_tarea);

-- Tareas programadas.
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_programada
  ON red_ai.tareas_comerciales (fecha_programada);

-- Tareas vencidas o próximas.
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_vencimiento
  ON red_ai.tareas_comerciales (fecha_vencimiento);

-- Tablero operativo: estado + usuario + fecha.
CREATE INDEX IF NOT EXISTS idx_tareas_estado_usuario_fecha
  ON red_ai.tareas_comerciales (estado_tarea_id, usuario_id, fecha_programada);

-- Tareas no completadas.
CREATE INDEX IF NOT EXISTS idx_tareas_pendientes
  ON red_ai.tareas_comerciales (estado_tarea_id, fecha_programada)
  WHERE completed_at IS NULL;


-- ======================================================
-- 11. DERIVACIONES HUMANAS
-- ======================================================

-- Derivaciones por conversación.
CREATE INDEX IF NOT EXISTS idx_derivaciones_conversacion
  ON red_ai.derivaciones_humanas (conversacion_id);

-- Derivaciones por lead.
CREATE INDEX IF NOT EXISTS idx_derivaciones_lead
  ON red_ai.derivaciones_humanas (lead_id);

-- Derivaciones por cliente.
CREATE INDEX IF NOT EXISTS idx_derivaciones_cliente
  ON red_ai.derivaciones_humanas (cliente_id);

-- Derivaciones por usuario asignado.
CREATE INDEX IF NOT EXISTS idx_derivaciones_usuario
  ON red_ai.derivaciones_humanas (usuario_asignado_id);

-- Derivaciones por estado.
CREATE INDEX IF NOT EXISTS idx_derivaciones_estado
  ON red_ai.derivaciones_humanas (estado_derivacion_id);

-- Derivaciones por prioridad.
CREATE INDEX IF NOT EXISTS idx_derivaciones_prioridad
  ON red_ai.derivaciones_humanas (prioridad_derivacion);

-- Derivaciones abiertas / no cerradas.
CREATE INDEX IF NOT EXISTS idx_derivaciones_abiertas
  ON red_ai.derivaciones_humanas (estado_derivacion_id, created_at)
  WHERE cerrada_at IS NULL;

-- Derivaciones tomadas pero no cerradas.
CREATE INDEX IF NOT EXISTS idx_derivaciones_tomadas_no_cerradas
  ON red_ai.derivaciones_humanas (usuario_asignado_id, tomada_at)
  WHERE tomada_at IS NOT NULL
    AND cerrada_at IS NULL;
