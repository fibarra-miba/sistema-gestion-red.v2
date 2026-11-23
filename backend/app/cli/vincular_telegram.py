"""Vincula una cuenta de Telegram con un usuario del sistema (asistente, docs/asistente.md).

Uso (dentro del contenedor api):
  python -m app.cli.vincular_telegram vincular <username> <telegram_user_id>
  python -m app.cli.vincular_telegram desvincular <username>
  python -m app.cli.vincular_telegram listar

El ID de Telegram lo informa el bot con /id. Un usuario tiene a lo sumo una cuenta
vinculada; volver a vincular reemplaza la anterior.
"""
from __future__ import annotations

import os
import sys

import psycopg

from app.repositories.asistente_repo import AsistenteRepository

USO = (
    "Uso:\n"
    "  vincular <username> <telegram_user_id>\n"
    "  desvincular <username>\n"
    "  listar"
)


def _usuario_id(conn: psycopg.Connection, username: str) -> int:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT usuario_id FROM usuarios WHERE lower(username_usuario) = lower(%s)",
            (username,),
        )
        row = cur.fetchone()
    if not row:
        raise ValueError(f"No existe el usuario '{username}'.")
    return row[0]


def main(argv: list[str]) -> int:
    if not argv:
        print(USO)
        return 2

    accion = argv[0]
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        repo = AsistenteRepository(conn)
        try:
            if accion == "vincular" and len(argv) == 3:
                telegram_id = int(argv[2])
                if telegram_id <= 0:
                    raise ValueError("El ID de Telegram debe ser un número positivo.")
                repo.vincular(_usuario_id(conn, argv[1]), telegram_id)
                conn.commit()
                print(f"Vinculado: {argv[1]} ↔ Telegram {telegram_id}")
            elif accion == "desvincular" and len(argv) == 2:
                if repo.desvincular(_usuario_id(conn, argv[1])):
                    conn.commit()
                    print(f"Desvinculado: {argv[1]}")
                else:
                    print(f"{argv[1]} no tenía una cuenta vinculada.")
            elif accion == "listar" and len(argv) == 1:
                filas = repo.listar_vinculaciones()
                if not filas:
                    print("No hay cuentas vinculadas.")
                for f in filas:
                    estado = "activa" if f["activo_vinculacion"] else "inactiva"
                    print(
                        f'{f["username_usuario"]:<20} {f["telegram_user_id"]:<15} '
                        f'{estado:<9} {f["fecha_vinculacion"]:%Y-%m-%d}'
                    )
            else:
                print(USO)
                return 2
        except (ValueError, psycopg.errors.UniqueViolation) as e:
            conn.rollback()
            if isinstance(e, psycopg.errors.UniqueViolation):
                print("Ese ID de Telegram ya está vinculado a otro usuario.")
            else:
                print(e)
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
