-- Migración idempotente para bases ya levantadas.
--
-- Asistente por Telegram (docs/asistente.md): vincula una cuenta de Telegram con
-- un usuario del sistema. El bot actúa como ese usuario (sus permisos y su
-- auditoría); una cuenta no vinculada no obtiene nada.
BEGIN;

CREATE TABLE IF NOT EXISTS usuarios_telegram (
  usuario_id                 BIGINT PRIMARY KEY,
  telegram_user_id           BIGINT NOT NULL,
  activo_vinculacion         BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_vinculacion          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE usuarios_telegram DROP CONSTRAINT IF EXISTS fk_usuarios_telegram_usuario;
ALTER TABLE usuarios_telegram
  ADD CONSTRAINT fk_usuarios_telegram_usuario
  FOREIGN KEY (usuario_id)
  REFERENCES usuarios(usuario_id);

ALTER TABLE usuarios_telegram DROP CONSTRAINT IF EXISTS uq_usuarios_telegram_telegram_id;
ALTER TABLE usuarios_telegram
  ADD CONSTRAINT uq_usuarios_telegram_telegram_id
  UNIQUE (telegram_user_id);

COMMIT;
