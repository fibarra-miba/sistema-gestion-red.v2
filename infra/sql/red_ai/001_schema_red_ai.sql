-- ======================================================
-- 001_schema_red_ai.sql
-- Extensión IA / n8n / RAG / Conversacional para Sistema RED
-- PostgreSQL
--
-- IMPORTANTE:
-- Este script NO modifica tablas existentes del sistema RED.
-- Todo lo nuevo se crea dentro del schema red_ai.
-- Las relaciones con public.clientes, public.usuarios, etc.
-- se agregan luego en 002_constraints_red_ai.sql.
-- ======================================================


-- ======================================================
-- 0. SCHEMA / EXTENSIONES
-- ======================================================

CREATE SCHEMA IF NOT EXISTS red_ai;

-- Requerido para almacenar embeddings en PostgreSQL.
-- Si el entorno no tiene pgvector instalado, esta línea puede fallar.
-- En ese caso, se puede reemplazar la columna embedding por JSONB o TEXT
-- hasta instalar pgvector.
CREATE EXTENSION IF NOT EXISTS vector;


-- ======================================================
-- 1. CATÁLOGOS / ESTADOS
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.estado_lead (
  estado_lead_id                BIGSERIAL PRIMARY KEY,
  codigo_estado_lead            VARCHAR(30) NOT NULL,
  descripcion_estado_lead       VARCHAR(100) NOT NULL,
  activo_estado_lead            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.estado_conversacion (
  estado_conversacion_id        BIGSERIAL PRIMARY KEY,
  codigo_estado_conversacion    VARCHAR(30) NOT NULL,
  descripcion_estado_conversacion VARCHAR(100) NOT NULL,
  activo_estado_conversacion    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.estado_tarea (
  estado_tarea_id               BIGSERIAL PRIMARY KEY,
  codigo_estado_tarea           VARCHAR(30) NOT NULL,
  descripcion_estado_tarea      VARCHAR(100) NOT NULL,
  activo_estado_tarea           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.estado_derivacion (
  estado_derivacion_id          BIGSERIAL PRIMARY KEY,
  codigo_estado_derivacion      VARCHAR(30) NOT NULL,
  descripcion_estado_derivacion VARCHAR(100) NOT NULL,
  activo_estado_derivacion      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.canal_contacto (
  canal_contacto_id             BIGSERIAL PRIMARY KEY,
  codigo_canal_contacto         VARCHAR(30) NOT NULL,
  descripcion_canal_contacto    VARCHAR(100) NOT NULL,
  activo_canal_contacto         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.tipo_intencion (
  tipo_intencion_id             BIGSERIAL PRIMARY KEY,
  codigo_tipo_intencion         VARCHAR(50) NOT NULL,
  descripcion_tipo_intencion    VARCHAR(150) NOT NULL,
  requiere_rag_default          BOOLEAN NOT NULL DEFAULT FALSE,
  requiere_humano_default       BOOLEAN NOT NULL DEFAULT FALSE,
  activo_tipo_intencion         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.tipo_documento_rag (
  tipo_documento_rag_id         BIGSERIAL PRIMARY KEY,
  codigo_tipo_documento_rag     VARCHAR(50) NOT NULL,
  descripcion_tipo_documento_rag VARCHAR(150) NOT NULL,
  activo_tipo_documento_rag     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.tipo_agente_ia (
  tipo_agente_ia_id             BIGSERIAL PRIMARY KEY,
  codigo_tipo_agente_ia         VARCHAR(50) NOT NULL,
  descripcion_tipo_agente_ia    VARCHAR(150) NOT NULL,
  activo_tipo_agente_ia         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.estado_respuesta_ia (
  estado_respuesta_ia_id        BIGSERIAL PRIMARY KEY,
  codigo_estado_respuesta_ia    VARCHAR(30) NOT NULL,
  descripcion_estado_respuesta_ia VARCHAR(100) NOT NULL,
  activo_estado_respuesta_ia    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.estado_automatizacion (
  estado_automatizacion_id      BIGSERIAL PRIMARY KEY,
  codigo_estado_automatizacion  VARCHAR(30) NOT NULL,
  descripcion_estado_automatizacion VARCHAR(100) NOT NULL,
  activo_estado_automatizacion  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.estado_zona_comercial (
  estado_zona_comercial_id      BIGSERIAL PRIMARY KEY,
  codigo_estado_zona_comercial  VARCHAR(30) NOT NULL,
  descripcion_estado_zona_comercial VARCHAR(100) NOT NULL,
  activo_estado_zona_comercial  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ======================================================
-- 2. LEADS / INTERESADOS
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.leads (
  lead_id                       BIGSERIAL PRIMARY KEY,

  nombre_lead                   VARCHAR(100),
  apellido_lead                 VARCHAR(100),
  telefono_lead                 VARCHAR(30),
  email_lead                    VARCHAR(120),

  canal_contacto_id             BIGINT NOT NULL,
  estado_lead_id                BIGINT NOT NULL,

  zona_interes                  VARCHAR(150),
  direccion_aproximada          VARCHAR(200),
  localidad_lead                VARCHAR(100),
  provincia_lead                VARCHAR(100),

  tipo_uso_lead                 VARCHAR(50),   -- hogar, comercio, finca, emprendimiento, otro
  necesidad_lead                TEXT,
  observacion_lead              TEXT,

  score_lead                    INTEGER,
  prioridad_lead                VARCHAR(20),   -- baja, media, alta

  cliente_id                    BIGINT,        -- referencia futura a public.clientes
  fecha_conversion_cliente      TIMESTAMPTZ,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.lead_datos_capturados (
  lead_dato_id                  BIGSERIAL PRIMARY KEY,
  lead_id                       BIGINT NOT NULL,

  campo_lead_dato               VARCHAR(50) NOT NULL,
  valor_lead_dato               TEXT NOT NULL,

  fuente_lead_dato              VARCHAR(30) NOT NULL, -- ia, formulario, humano, importacion, sistema
  confianza_lead_dato           NUMERIC(5,2),

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ======================================================
-- 3. ZONAS COMERCIALES / DEMANDA
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.zonas_comerciales (
  zona_comercial_id             BIGSERIAL PRIMARY KEY,

  nombre_zona_comercial         VARCHAR(150) NOT NULL,
  localidad_zona_comercial      VARCHAR(100),
  provincia_zona_comercial      VARCHAR(100),

  estado_zona_comercial_id      BIGINT NOT NULL,

  latitud_referencia            NUMERIC(10,7),
  longitud_referencia           NUMERIC(10,7),
  radio_estimado_metros         INTEGER,

  observacion_zona_comercial    TEXT,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.zona_interes_leads (
  zona_interes_lead_id          BIGSERIAL PRIMARY KEY,

  zona_comercial_id             BIGINT,
  lead_id                       BIGINT NOT NULL,

  direccion_aproximada          VARCHAR(200),
  latitud_lead                  NUMERIC(10,7),
  longitud_lead                 NUMERIC(10,7),

  nivel_interes                 VARCHAR(30), -- bajo, medio, alto
  observacion_interes           TEXT,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ======================================================
-- 4. CONVERSACIONES Y MENSAJES
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.conversaciones (
  conversacion_id               BIGSERIAL PRIMARY KEY,

  lead_id                       BIGINT,
  cliente_id                    BIGINT,

  canal_contacto_id             BIGINT NOT NULL,
  identificador_externo         VARCHAR(120), -- teléfono WhatsApp, chat id, thread id, etc.

  estado_conversacion_id        BIGINT NOT NULL,

  asignado_usuario_id           BIGINT,       -- referencia futura a public.usuarios
  ultimo_mensaje_at             TIMESTAMPTZ,

  resumen_conversacion          TEXT,
  metadata_conversacion         JSONB,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.mensajes_conversacion (
  mensaje_id                    BIGSERIAL PRIMARY KEY,
  conversacion_id               BIGINT NOT NULL,

  direccion_mensaje             VARCHAR(10) NOT NULL, -- IN, OUT
  remitente_tipo                VARCHAR(20) NOT NULL, -- lead, cliente, bot, humano, sistema
  remitente_id                  BIGINT,

  contenido_mensaje             TEXT NOT NULL,

  id_externo_mensaje            VARCHAR(150),
  metadata_mensaje              JSONB,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ======================================================
-- 5. CLASIFICACIÓN IA / INTENCIONES
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.clasificaciones_mensaje (
  clasificacion_id              BIGSERIAL PRIMARY KEY,

  mensaje_id                    BIGINT NOT NULL,
  tipo_intencion_id             BIGINT NOT NULL,

  confianza_clasificacion       NUMERIC(5,2),

  requiere_rag                  BOOLEAN NOT NULL DEFAULT FALSE,
  requiere_humano               BOOLEAN NOT NULL DEFAULT FALSE,

  sentimiento_clasificacion     VARCHAR(30), -- positivo, neutral, negativo
  urgencia_clasificacion        VARCHAR(30), -- baja, media, alta, critica

  datos_extraidos               JSONB,

  modelo_usado                  VARCHAR(100),
  prompt_version                VARCHAR(50),

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ======================================================
-- 6. AGENTES IA / PROMPTS
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.agentes_ia (
  agente_ia_id                  BIGSERIAL PRIMARY KEY,

  nombre_agente_ia              VARCHAR(100) NOT NULL,
  tipo_agente_ia_id             BIGINT NOT NULL,

  descripcion_agente_ia         VARCHAR(200),
  activo_agente_ia              BOOLEAN NOT NULL DEFAULT TRUE,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.agente_versiones (
  agente_version_id             BIGSERIAL PRIMARY KEY,

  agente_ia_id                  BIGINT NOT NULL,

  version_agente                INTEGER NOT NULL,
  prompt_sistema                TEXT NOT NULL,

  modelo_default                VARCHAR(100),
  temperatura_default           NUMERIC(4,2),
  max_tokens_default            INTEGER,

  activo_version                BOOLEAN NOT NULL DEFAULT TRUE,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ======================================================
-- 7. RAG / DOCUMENTOS / CHUNKS
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.rag_documentos (
  documento_id                  BIGSERIAL PRIMARY KEY,

  titulo_documento              VARCHAR(200) NOT NULL,
  tipo_documento_rag_id         BIGINT NOT NULL,

  fuente_documento              VARCHAR(150),
  url_documento                 TEXT,

  contenido_original            TEXT,

  version_documento             INTEGER NOT NULL DEFAULT 1,
  activo_documento              BOOLEAN NOT NULL DEFAULT TRUE,

  metadata_documento            JSONB,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.rag_chunks (
  chunk_id                      BIGSERIAL PRIMARY KEY,

  documento_id                  BIGINT NOT NULL,

  orden_chunk                   INTEGER NOT NULL,
  contenido_chunk               TEXT NOT NULL,

  embedding                     VECTOR(1536),

  metadata_chunk                JSONB,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.rag_consultas (
  rag_consulta_id               BIGSERIAL PRIMARY KEY,

  conversacion_id               BIGINT,
  mensaje_id                    BIGINT,

  consulta_usuario              TEXT NOT NULL,
  consulta_normalizada          TEXT,

  modelo_embedding              VARCHAR(100),
  cantidad_chunks_solicitados   INTEGER,

  metadata_consulta             JSONB,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.rag_consulta_chunks (
  rag_consulta_id               BIGINT NOT NULL,
  chunk_id                      BIGINT NOT NULL,

  score_similitud               NUMERIC(8,5),
  orden_resultado               INTEGER,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (rag_consulta_id, chunk_id)
);


-- ======================================================
-- 8. RESPUESTAS IA
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.respuestas_ia (
  respuesta_ia_id               BIGSERIAL PRIMARY KEY,

  conversacion_id               BIGINT NOT NULL,
  mensaje_id                    BIGINT,
  agente_version_id             BIGINT,

  estado_respuesta_ia_id        BIGINT NOT NULL,

  prompt_usado                  TEXT,
  respuesta_generada            TEXT NOT NULL,

  modelo_usado                  VARCHAR(100),
  temperatura_usada             NUMERIC(4,2),

  tokens_input                  INTEGER,
  tokens_output                 INTEGER,

  requiere_revision             BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_revision               VARCHAR(200),

  metadata_respuesta            JSONB,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS red_ai.respuesta_ia_chunks (
  respuesta_ia_id               BIGINT NOT NULL,
  chunk_id                      BIGINT NOT NULL,

  score_chunk                   NUMERIC(8,5),
  orden_chunk_usado             INTEGER,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (respuesta_ia_id, chunk_id)
);


-- ======================================================
-- 9. AUTOMATIZACIONES / N8N
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.automatizaciones_eventos (
  automatizacion_evento_id      BIGSERIAL PRIMARY KEY,

  nombre_workflow               VARCHAR(150) NOT NULL,
  workflow_id_externo           VARCHAR(150),
  ejecucion_id_externa          VARCHAR(150),

  entidad_tipo                  VARCHAR(50), -- lead, cliente, conversacion, pago, instalacion, tarea
  entidad_id                    BIGINT,

  estado_automatizacion_id      BIGINT NOT NULL,

  input_payload                 JSONB,
  output_payload                JSONB,

  error_mensaje                 TEXT,
  reintentos                    INTEGER NOT NULL DEFAULT 0,

  started_at                    TIMESTAMPTZ,
  finished_at                   TIMESTAMPTZ,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ======================================================
-- 10. TAREAS COMERCIALES / OPERATIVAS
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.tareas_comerciales (
  tarea_id                      BIGSERIAL PRIMARY KEY,

  lead_id                       BIGINT,
  cliente_id                    BIGINT,
  conversacion_id               BIGINT,

  usuario_id                    BIGINT, -- referencia futura a public.usuarios

  estado_tarea_id               BIGINT NOT NULL,

  tipo_tarea                    VARCHAR(50) NOT NULL,
  titulo_tarea                  VARCHAR(150) NOT NULL,
  descripcion_tarea             TEXT,

  prioridad_tarea               VARCHAR(20), -- baja, media, alta, critica

  fecha_programada              TIMESTAMPTZ,
  fecha_vencimiento             TIMESTAMPTZ,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at                  TIMESTAMPTZ
);


-- ======================================================
-- 11. DERIVACIONES HUMANAS
-- ======================================================

CREATE TABLE IF NOT EXISTS red_ai.derivaciones_humanas (
  derivacion_id                 BIGSERIAL PRIMARY KEY,

  conversacion_id               BIGINT NOT NULL,
  lead_id                       BIGINT,
  cliente_id                    BIGINT,

  usuario_asignado_id           BIGINT, -- referencia futura a public.usuarios

  estado_derivacion_id          BIGINT NOT NULL,

  motivo_derivacion             VARCHAR(100) NOT NULL,
  resumen_contexto              TEXT,

  prioridad_derivacion          VARCHAR(20), -- baja, media, alta, critica

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  tomada_at                     TIMESTAMPTZ,
  cerrada_at                    TIMESTAMPTZ
);
