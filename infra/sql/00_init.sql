-- ======================================================
-- 00_init.sql
-- Orquestador de bootstrap de la base (Postgres initdb).
--
-- Es el ÚNICO archivo en el primer nivel de infra/sql, por lo tanto
-- lo único que /docker-entrypoint-initdb.d ejecuta automáticamente:
-- el entrypoint de Postgres NO recorre subdirectorios, así que core/,
-- red_ai/, migrations/ y diagnostics/ no se autoejecutan por sí solos.
--
-- \ir incluye relativo a la ubicación de ESTE archivo (no al CWD de psql).
-- El entrypoint corre con ON_ERROR_STOP=on, así que cualquier error aborta
-- el init en vez de dejar una base a medias.
--
-- ORDEN (no alterar): el core (schema public) va completo ANTES que red_ai,
-- porque red_ai/002 tiene FK a public.clientes.
-- migrations/ y diagnostics/ quedan FUERA del init a propósito (aplicación
-- y uso manual).
-- ======================================================

\echo '== RED core =='
\ir core/001_schema.sql
\ir core/002_constraints.sql
\ir core/003_indexes.sql
\ir core/005_catalogos_base.sql
\ir core/006_post_seed.sql
\ir core/010_seed.sql

\echo '== RED AI (schema red_ai) =='
\ir red_ai/001_schema_red_ai.sql
\ir red_ai/002_constraints_red_ai.sql
\ir red_ai/003_indexes_red_ai.sql
\ir red_ai/005_catalogos_base_red_ai.sql
\ir red_ai/006_post_seed_red_ai.sql
