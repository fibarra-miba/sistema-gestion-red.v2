"""La transacción de cada request se confirma ANTES de responder.

Con el scope por defecto ("request"), FastAPI corre el código posterior al
`yield` de get_db después de enviar la respuesta: el cliente recibía 200 antes
del commit. Eso producía lecturas viejas justo después de escribir (p. ej. el
login respondía con la cookie antes de que la sesión existiera → 401 en el
request siguiente) y, si el commit fallaba, un "OK" sobre datos descartados.

Chequeo estático sobre el código: el árbol de rutas de FastAPI anida los routers
incluidos en estructuras privadas, y atar el test a eso lo rompería en cada upgrade.
"""
import pathlib
import re

APP_DIR = pathlib.Path(__file__).resolve().parent.parent / "app"
USO_GET_DB = re.compile(r"Depends\(\s*get_db\b[^)]*\)")


def test_get_db_siempre_con_scope_function():
    usos = []
    for path in sorted(APP_DIR.rglob("*.py")):
        for n, linea in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for m in USO_GET_DB.finditer(linea):
                usos.append((f"{path.relative_to(APP_DIR)}:{n}", m.group(0)))

    assert usos, "No se encontró ningún Depends(get_db...) en app/."
    mal = [donde for donde, uso in usos if 'scope="function"' not in uso]
    assert not mal, f'Usar Depends(get_db, scope="function") en: {mal}'
