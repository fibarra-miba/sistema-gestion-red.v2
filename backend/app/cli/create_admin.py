"""Crea (o recupera acceso con) un usuario ADMIN desde la línea de comandos.

Uso (dentro del contenedor api):  python -m app.cli.create_admin
"""
from __future__ import annotations

import getpass
import sys

import psycopg

from app.core.security import hash_password, validate_password_policy
from app.repositories.usuarios_repo import UsuariosRepository


def existe_admin_activo(conn: psycopg.Connection) -> bool:
    return UsuariosRepository(conn).existe_admin_activo()


def crear_admin(
    conn: psycopg.Connection,
    *,
    username: str,
    email: str,
    nombre: str,
    apellido: str,
    password: str,
) -> int:
    """Inserta un ADMIN activo que debe cambiar la contraseña al primer ingreso.

    No hace commit: lo decide quien llama. Devuelve el usuario_id.
    """
    username = username.strip()
    email = email.strip()
    nombre = nombre.strip()
    apellido = apellido.strip()

    if len(username) < 3:
        raise ValueError("El username debe tener al menos 3 caracteres.")
    if "@" not in email:
        raise ValueError("El email no es válido.")
    if not nombre or not apellido:
        raise ValueError("Nombre y apellido son obligatorios.")

    validate_password_policy(password)

    repo = UsuariosRepository(conn)
    existentes = repo.username_o_email_existe(username, email)
    if existentes["username"]:
        raise ValueError(f"Ya existe un usuario con el username '{username}'.")
    if existentes["email"]:
        raise ValueError(f"Ya existe un usuario con el email '{email}'.")

    rol = repo.get_rol_by_codigo("ADMIN")
    if not rol:
        raise ValueError("No existe el rol ADMIN en la base.")

    user = repo.create_usuario(
        {
            "rol_id": rol["rol_id"],
            "username_usuario": username,
            "email_usuario": email,
            "password_hash_usuario": hash_password(password),
            "nombre_usuario": nombre,
            "apellido_usuario": apellido,
            "activo_usuario": True,
            "requiere_cambio_password_usuario": True,
        }
    )
    usuario_id = int(user["usuario_id"])

    repo.insert_audit_event(
        usuario_id=usuario_id,
        modulo_auditoria="USUARIOS",
        accion_auditoria="CREAR_ADMIN_CLI",
        entidad_auditoria="usuarios",
        entidad_id_auditoria=str(usuario_id),
        detalle_auditoria=f"USERNAME={username} | ROL=ADMIN",
        ip_origen_auditoria=None,
        user_agent_auditoria=None,
    )
    return usuario_id


def _pedir(etiqueta: str, default: str | None = None) -> str:
    sufijo = f" [{default}]" if default else ""
    while True:
        valor = input(f"{etiqueta}{sufijo}: ").strip() or (default or "")
        if valor:
            return valor
        print("Este dato es obligatorio.")


def _pedir_password() -> str:
    while True:
        password = getpass.getpass("Contraseña: ")
        try:
            validate_password_policy(password)
        except ValueError as e:
            print(e)
            continue
        if getpass.getpass("Repetir contraseña: ") != password:
            print("Las contraseñas no coinciden.")
            continue
        return password


def main() -> int:
    from app.db import DATABASE_URL

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            if existe_admin_activo(conn):
                print("Ya existe al menos un ADMIN activo.")
                if input("¿Crear otro ADMIN igualmente? [s/N]: ").strip().lower() != "s":
                    print("Operación cancelada.")
                    return 1

            username = _pedir("Username", "admin")
            email = _pedir("Email")
            nombre = _pedir("Nombre", "Admin")
            apellido = _pedir("Apellido", "Sistema")
            password = _pedir_password()

            try:
                usuario_id = crear_admin(
                    conn,
                    username=username,
                    email=email,
                    nombre=nombre,
                    apellido=apellido,
                    password=password,
                )
            except ValueError as e:
                conn.rollback()
                print(f"Error: {e}")
                return 1
            conn.commit()
    except (KeyboardInterrupt, EOFError):
        print("\nOperación cancelada.")
        return 130
    except psycopg.Error as e:
        print(f"Error de base de datos: {e}")
        return 1

    print(f"ADMIN '{username}' creado (usuario_id={usuario_id}).")
    print("El usuario deberá cambiar la contraseña en el primer ingreso.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
