# backend/test/test_garantias.py

import pytest


# Estados de garantía sembrados en 005_catalogos_base.sql (orden de inserción).
ESTADO_ACTIVA = 1
ESTADO_ANULADA = 3


def _setup_equipo_en_instalacion(db_conn):
    """
    El seed sólo trae un producto de tipo SERVICIO. Las garantías exigen un
    producto de tipo EQUIPO presente en los detalles de la instalación, y no hay
    endpoint para crear tipo_producto, así que se siembra por SQL directo sobre
    la instalación COMPLETADA del seed (INST-0001, contrato 2).

    Devuelve (instalacion_id, equipo_producto_id, servicio_producto_id).
    """
    with db_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO tipo_producto (codigo_tproducto, descripcion_tproducto, activo_tproducto)
            VALUES ('EQUIPO', 'Equipo entregado', TRUE)
            RETURNING tipo_producto_id
            """
        )
        tipo_equipo_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO productos (
                nombre_producto, descripcion_producto, marca_producto,
                modelo_producto, activo_producto, tipo_producto_id
            )
            VALUES ('Router Fibra', 'ONT', 'Huawei', 'HG8245', TRUE, %s)
            RETURNING producto_id
            """,
            (tipo_equipo_id,),
        )
        equipo_producto_id = cur.fetchone()[0]

        cur.execute(
            "SELECT instalacion_id FROM instalaciones WHERE codigo_instalacion = 'INST-0001'"
        )
        instalacion_id = cur.fetchone()[0]

        cur.execute(
            "SELECT producto_id FROM productos ORDER BY producto_id ASC LIMIT 1"
        )
        servicio_producto_id = cur.fetchone()[0]

        # El equipo debe figurar en los detalles de la instalación.
        cur.execute(
            """
            INSERT INTO detalle_instalacion (
                instalacion_id, producto_id, descripcion_dinstalacion,
                cantidad_dinstalacion, unidad_dinstalacion
            )
            VALUES (%s, %s, 'Router entregado', 1, 'u')
            """,
            (instalacion_id, equipo_producto_id),
        )
    db_conn.commit()
    return instalacion_id, equipo_producto_id, servicio_producto_id


# ==========================================================
# CREATE
# ==========================================================

@pytest.mark.anyio
async def test_crear_garantia_ok(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    response = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["instalacion_id"] == instalacion_id
    assert data["producto_id"] == equipo_id
    assert data["estado_garantia_id"] == ESTADO_ACTIVA
    assert data["descripcion_egarantia"] == "ACTIVA"
    assert data["fecha_fin_garantia"] is None


@pytest.mark.anyio
async def test_crear_garantia_producto_no_instalado_422(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    # Reusamos el tipo EQUIPO del equipo ya instalado.
    instalado = await admin_client.get(f"/productos/{equipo_id}")
    assert instalado.status_code == 200, instalado.text
    tipo_equipo_id = instalado.json()["tipo_producto_id"]

    # Producto EQUIPO que existe pero NO está en los detalles de la instalación.
    otro_equipo = await admin_client.post(
        "/productos",
        json={
            "nombre_producto": "Equipo no instalado",
            "marca_producto": "X",
            "modelo_producto": "Y",
            "tipo_producto_id": tipo_equipo_id,
        },
    )
    assert otro_equipo.status_code == 200, otro_equipo.text

    response = await admin_client.post(
        "/instalaciones/garantias",
        json={
            "instalacion_id": instalacion_id,
            "producto_id": otro_equipo.json()["producto_id"],
        },
    )
    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_crear_garantia_producto_no_equipo_422(admin_client, db_conn):
    instalacion_id, _, servicio_id = _setup_equipo_en_instalacion(db_conn)

    # El producto SERVICIO sí está en el detalle, pero no es EQUIPO.
    response = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": servicio_id},
    )
    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_crear_garantia_duplicada_activa_409(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    primera = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert primera.status_code == 200, primera.text

    segunda = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert segunda.status_code == 409, segunda.text


# ==========================================================
# GET / LIST
# ==========================================================

@pytest.mark.anyio
async def test_get_garantia_404(admin_client):
    response = await admin_client.get("/instalaciones/garantias/99999")
    assert response.status_code == 404, response.text


@pytest.mark.anyio
async def test_list_garantias_filtros(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert creada.status_code == 200, creada.text

    # Por instalación: incluye la garantía del seed + la recién creada.
    por_instalacion = await admin_client.get(
        "/instalaciones/garantias", params={"instalacion_id": instalacion_id}
    )
    assert por_instalacion.status_code == 200, por_instalacion.text
    productos = [g["producto_id"] for g in por_instalacion.json()["items"]]
    assert equipo_id in productos

    # Por estado ACTIVA.
    activas = await admin_client.get(
        "/instalaciones/garantias", params={"estado_garantia_id": ESTADO_ACTIVA}
    )
    assert activas.status_code == 200, activas.text
    assert all(g["estado_garantia_id"] == ESTADO_ACTIVA for g in activas.json()["items"])


# ==========================================================
# UPDATE / ANULACIÓN
# ==========================================================

@pytest.mark.anyio
async def test_anular_garantia_requiere_resolucion_y_luego_ok(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert creada.status_code == 200, creada.text
    garantia_id = creada.json()["garantia_id"]

    # Anular sin resolución → 422.
    sin_resolucion = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"estado_garantia_id": ESTADO_ANULADA},
    )
    assert sin_resolucion.status_code == 422, sin_resolucion.text

    # Anular con resolución → 200, fecha_fin se completa sola.
    con_resolucion = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={
            "estado_garantia_id": ESTADO_ANULADA,
            "resolucion_garantia": "Equipo reemplazado por falla",
        },
    )
    assert con_resolucion.status_code == 200, con_resolucion.text
    data = con_resolucion.json()
    assert data["estado_garantia_id"] == ESTADO_ANULADA
    assert data["fecha_fin_garantia"] is not None


@pytest.mark.anyio
async def test_update_garantia_anulada_es_terminal_400(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert creada.status_code == 200, creada.text
    garantia_id = creada.json()["garantia_id"]

    anular = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={
            "estado_garantia_id": ESTADO_ANULADA,
            "resolucion_garantia": "Anulada",
        },
    )
    assert anular.status_code == 200, anular.text

    # Una garantía ANULADA es terminal: no admite más cambios.
    reintento = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"motivo_garantia": "no debería poder"},
    )
    assert reintento.status_code == 400, reintento.text
