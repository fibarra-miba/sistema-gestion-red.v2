-- ======================================================
-- 005_catalogos_base_red_ai.sql
-- Catálogos mínimos operativos para red_ai
-- Extensión IA / n8n / RAG / Conversacional para Sistema RED
--
-- IMPORTANTE:
-- Este script NO modifica catálogos existentes del sistema RED.
-- Solo inserta datos en tablas del schema red_ai.
-- ======================================================


-- ======================================================
-- 1. ESTADO_LEAD
-- ======================================================

INSERT INTO red_ai.estado_lead (
  codigo_estado_lead,
  descripcion_estado_lead,
  activo_estado_lead
) VALUES
  ('NUEVO', 'Lead nuevo ingresado al sistema', TRUE),
  ('CONTACTADO', 'Lead contactado al menos una vez', TRUE),
  ('INTERESADO', 'Lead con interés comercial detectado', TRUE),
  ('CALIFICANDO', 'Lead en proceso de calificación', TRUE),
  ('ZONA_A_VALIDAR', 'Lead pendiente de validación de zona', TRUE),
  ('INTERES_REAL_DE_ZONA', 'Lead usado para medir interés real de una zona', TRUE),
  ('PENDIENTE_RELEVAMIENTO', 'Lead pendiente de relevamiento técnico/comercial', TRUE),
  ('LISTO_PARA_ALTA', 'Lead calificado y listo para crear cliente/contrato', TRUE),
  ('CONVERTIDO_CLIENTE', 'Lead convertido en cliente del sistema RED', TRUE),
  ('NO_VIABLE', 'Lead no viable por zona, técnica, costo o disponibilidad', TRUE),
  ('PENDIENTE_RESPUESTA', 'Lead pendiente de respuesta del interesado', TRUE),
  ('DESCARTADO', 'Lead descartado comercialmente', TRUE);


-- ======================================================
-- 2. ESTADO_CONVERSACION
-- ======================================================

INSERT INTO red_ai.estado_conversacion (
  codigo_estado_conversacion,
  descripcion_estado_conversacion,
  activo_estado_conversacion
) VALUES
  ('ABIERTA', 'Conversación abierta', TRUE),
  ('EN_BOT', 'Conversación atendida por bot/IA', TRUE),
  ('EN_HUMANO', 'Conversación atendida por usuario humano', TRUE),
  ('ESPERANDO_CLIENTE', 'Conversación pendiente de respuesta del cliente o lead', TRUE),
  ('ESCALADA', 'Conversación escalada para revisión humana', TRUE),
  ('CERRADA', 'Conversación cerrada', TRUE);


-- ======================================================
-- 3. ESTADO_TAREA
-- ======================================================

INSERT INTO red_ai.estado_tarea (
  codigo_estado_tarea,
  descripcion_estado_tarea,
  activo_estado_tarea
) VALUES
  ('PENDIENTE', 'Tarea pendiente de ejecución', TRUE),
  ('EN_PROCESO', 'Tarea en proceso', TRUE),
  ('COMPLETADA', 'Tarea completada', TRUE),
  ('CANCELADA', 'Tarea cancelada', TRUE),
  ('VENCIDA', 'Tarea vencida', TRUE);


-- ======================================================
-- 4. ESTADO_DERIVACION
-- ======================================================

INSERT INTO red_ai.estado_derivacion (
  codigo_estado_derivacion,
  descripcion_estado_derivacion,
  activo_estado_derivacion
) VALUES
  ('ABIERTA', 'Derivación abierta pendiente de toma', TRUE),
  ('TOMADA', 'Derivación tomada por un usuario', TRUE),
  ('RESUELTA', 'Derivación resuelta', TRUE),
  ('CANCELADA', 'Derivación cancelada', TRUE);


-- ======================================================
-- 5. CANAL_CONTACTO
-- ======================================================

INSERT INTO red_ai.canal_contacto (
  codigo_canal_contacto,
  descripcion_canal_contacto,
  activo_canal_contacto
) VALUES
  ('WHATSAPP', 'WhatsApp', TRUE),
  ('WEB', 'Formulario o chat web', TRUE),
  ('INSTAGRAM', 'Instagram', TRUE),
  ('FACEBOOK', 'Facebook', TRUE),
  ('EMAIL', 'Correo electrónico', TRUE),
  ('TELEFONO', 'Llamada telefónica', TRUE),
  ('PRESENCIAL', 'Contacto presencial', TRUE),
  ('REFERIDO', 'Contacto referido por tercero', TRUE),
  ('SISTEMA', 'Evento generado por sistema', TRUE);


-- ======================================================
-- 6. TIPO_INTENCION
-- ======================================================

INSERT INTO red_ai.tipo_intencion (
  codigo_tipo_intencion,
  descripcion_tipo_intencion,
  requiere_rag_default,
  requiere_humano_default,
  activo_tipo_intencion
) VALUES
  ('NUEVO_INTERESADO', 'Nuevo interesado detectado', FALSE, FALSE, TRUE),
  ('CLIENTE_EXISTENTE', 'Persona identificada como cliente existente', FALSE, FALSE, TRUE),

  ('CONSULTA_ZONA', 'Consulta por cobertura o disponibilidad en una zona', TRUE, FALSE, TRUE),
  ('CONSULTA_PRECIO', 'Consulta por precios, planes o promociones', TRUE, FALSE, TRUE),
  ('CONSULTA_PLANES', 'Consulta sobre planes disponibles', TRUE, FALSE, TRUE),
  ('CONSULTA_INSTALACION', 'Consulta sobre proceso, requisitos o tiempos de instalación', TRUE, FALSE, TRUE),
  ('CONSULTA_REQUISITOS', 'Consulta sobre requisitos para contratar el servicio', TRUE, FALSE, TRUE),
  ('CONSULTA_SOPORTE', 'Consulta general sobre soporte o atención', TRUE, FALSE, TRUE),
  ('CONSULTA_COMODATO', 'Consulta sobre equipos entregados, comodato o responsabilidad del cliente', TRUE, FALSE, TRUE),
  ('CONSULTA_STARLINK', 'Consulta relacionada con antena Starlink, conectividad base o equipos', TRUE, FALSE, TRUE),

  ('SOLICITUD_ALTA', 'Solicitud explícita para avanzar con el alta del servicio', FALSE, TRUE, TRUE),
  ('SOLICITUD_RELEVAMIENTO', 'Solicitud de relevamiento técnico o visita', FALSE, TRUE, TRUE),
  ('SOLICITUD_CONTACTO_HUMANO', 'Solicitud explícita de contacto con una persona', FALSE, TRUE, TRUE),

  ('RECLAMO_SERVICIO', 'Reclamo por funcionamiento del servicio', FALSE, TRUE, TRUE),
  ('SOPORTE_TECNICO', 'Solicitud de soporte técnico', FALSE, TRUE, TRUE),
  ('GARANTIA_EQUIPO', 'Consulta o reclamo relacionado con garantía de equipo', FALSE, TRUE, TRUE),
  ('SOLICITUD_BAJA', 'Solicitud o intención de baja del servicio', FALSE, TRUE, TRUE),

  ('COMPROBANTE_PAGO', 'Envío o consulta de comprobante de pago', FALSE, TRUE, TRUE),
  ('CONSULTA_DEUDA', 'Consulta sobre deuda, saldo o estado de cuenta', FALSE, TRUE, TRUE),
  ('CONSULTA_FACTURA', 'Consulta sobre factura emitida o vencimiento', FALSE, TRUE, TRUE),

  ('QUEJA', 'Mensaje con queja o disconformidad', FALSE, TRUE, TRUE),
  ('AGRADECIMIENTO', 'Mensaje de agradecimiento', FALSE, FALSE, TRUE),
  ('SALUDO', 'Saludo o inicio de conversación sin intención clara', FALSE, FALSE, TRUE),
  ('OTRO', 'Intención no clasificada', FALSE, FALSE, TRUE);


-- ======================================================
-- 7. TIPO_DOCUMENTO_RAG
-- ======================================================

INSERT INTO red_ai.tipo_documento_rag (
  codigo_tipo_documento_rag,
  descripcion_tipo_documento_rag,
  activo_tipo_documento_rag
) VALUES
  ('FAQ', 'Preguntas frecuentes', TRUE),
  ('PLANES', 'Información comercial sobre planes', TRUE),
  ('PRECIOS', 'Información comercial sobre precios', TRUE),
  ('PROMOCIONES', 'Información sobre promociones vigentes o históricas', TRUE),
  ('PROCESO_INSTALACION', 'Proceso de interés, relevamiento e instalación', TRUE),
  ('REQUISITOS', 'Requisitos para contratar o instalar', TRUE),
  ('SOPORTE', 'Información de soporte y atención post instalación', TRUE),
  ('COMODATO', 'Condiciones de comodato o equipos entregados', TRUE),
  ('GARANTIA', 'Información general de garantías', TRUE),
  ('COBERTURA', 'Información de cobertura o zonas', TRUE),
  ('POLITICA_COMERCIAL', 'Criterios comerciales internos', TRUE),
  ('GUION_COMERCIAL', 'Guiones o lineamientos de venta', TRUE),
  ('OBJECIONES', 'Objeciones frecuentes y respuestas sugeridas', TRUE),
  ('MANUAL_INTERNO', 'Manual operativo interno', TRUE),
  ('LEGAL', 'Texto legal, condiciones o políticas formales', TRUE),
  ('OTRO', 'Documento no clasificado', TRUE);


-- ======================================================
-- 8. TIPO_AGENTE_IA
-- ======================================================

INSERT INTO red_ai.tipo_agente_ia (
  codigo_tipo_agente_ia,
  descripcion_tipo_agente_ia,
  activo_tipo_agente_ia
) VALUES
  ('CLASIFICADOR', 'Agente clasificador de intención y contexto', TRUE),
  ('COMERCIAL', 'Agente comercial para captación y calificación de leads', TRUE),
  ('RAG', 'Agente de respuesta con base documental', TRUE),
  ('SOPORTE', 'Agente orientado a soporte y reclamos', TRUE),
  ('COBRANZAS', 'Agente orientado a pagos, deuda y comprobantes', TRUE),
  ('RESUMEN', 'Agente generador de resúmenes de conversación', TRUE),
  ('DERIVACION', 'Agente que decide o prepara derivaciones humanas', TRUE),
  ('SISTEMA', 'Agente interno de automatización del sistema', TRUE);


-- ======================================================
-- 9. ESTADO_RESPUESTA_IA
-- ======================================================

INSERT INTO red_ai.estado_respuesta_ia (
  codigo_estado_respuesta_ia,
  descripcion_estado_respuesta_ia,
  activo_estado_respuesta_ia
) VALUES
  ('GENERADA', 'Respuesta generada por IA', TRUE),
  ('ENVIADA', 'Respuesta enviada al canal correspondiente', TRUE),
  ('BLOQUEADA', 'Respuesta bloqueada por regla de seguridad o negocio', TRUE),
  ('PENDIENTE_REVISION', 'Respuesta pendiente de revisión humana', TRUE),
  ('REVISADA', 'Respuesta revisada por usuario humano', TRUE),
  ('DESCARTADA', 'Respuesta descartada y no enviada', TRUE);


-- ======================================================
-- 10. ESTADO_AUTOMATIZACION
-- ======================================================

INSERT INTO red_ai.estado_automatizacion (
  codigo_estado_automatizacion,
  descripcion_estado_automatizacion,
  activo_estado_automatizacion
) VALUES
  ('INICIADO', 'Workflow o automatización iniciada', TRUE),
  ('EXITOSO', 'Workflow o automatización ejecutada correctamente', TRUE),
  ('FALLIDO', 'Workflow o automatización fallida', TRUE),
  ('REINTENTANDO', 'Workflow o automatización en reintento', TRUE),
  ('CANCELADO', 'Workflow o automatización cancelada', TRUE);


-- ======================================================
-- 11. ESTADO_ZONA_COMERCIAL
-- ======================================================

INSERT INTO red_ai.estado_zona_comercial (
  codigo_estado_zona_comercial,
  descripcion_estado_zona_comercial,
  activo_estado_zona_comercial
) VALUES
  ('A_EVALUAR', 'Zona pendiente de evaluación comercial o técnica', TRUE),
  ('MIDIENDO_INTERES', 'Zona en etapa de medición de interés real', TRUE),
  ('VIABLE', 'Zona considerada viable comercial o técnicamente', TRUE),
  ('NO_VIABLE', 'Zona considerada no viable actualmente', TRUE),
  ('ACTIVA', 'Zona actualmente activa para operación o captación', TRUE),
  ('PAUSADA', 'Zona pausada temporalmente', TRUE),
  ('FUTURA', 'Zona posible para expansión futura', TRUE);
