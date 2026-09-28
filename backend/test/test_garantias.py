# backend/test/test_garantias.py

import pytest


# Estados de garantía sembrados en 005_catalogos_base.sql (orden de inserción).
# 1 ACTIVA, 2 VENCIDA, 3 ANULADA, 4 DEVUELTA, 5 RETENIDA.
ESTADO_ACTIVA = 1
ESTADO_ANULADA = 3
ESTADO_DEVUELTA = 4
ESTADO_RETENIDA = 5


def _setup_equipo_en_instalacion(db_conn):
    """
    Las garantías exigen un producto de tipo EQUIPO presente en los detalles de
    la instalación. El tipo EQUIPO ya viene del catálogo base
    (005_catalogos_base.sql): se reusa, no se inserta — hay unicidad por código.
    El producto y el detalle sí se siembran por SQL directo sobre la instalación
    COMPLETADA del seed (INST-0001, contrato 2).

    Devuelve (instalacion_id, equipo_producto_id, servicio_producto_id).
    """
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT tipo_producto_id FROM tipo_producto WHERE codigo_tproducto = 'EQUIPO'"
        )
        fila = cur.fetchone()
        assert fila is not None, "El catálogo base debe traer el tipo EQUIPO."
        tipo_equipo_id = fila[0]

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


def _agregar_otro_equipo(db_conn, instalacion_id, tipo_equipo_id, nombre):
    """Suma un segundo (o tercer) equipo distinto a la misma instalación, para
    poder tener varias garantías ACTIVAS simultáneas sobre productos distintos."""
    with db_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO productos (
                nombre_producto, descripcion_producto, marca_producto,
                modelo_producto, activo_producto, tipo_producto_id
            )
            VALUES (%s, 'ONT', 'Huawei', 'HG8245', TRUE, %s)
            RETURNING producto_id
            """,
            (nombre, tipo_equipo_id),
        )
        equipo_producto_id = cur.fetchone()[0]

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
    return equipo_producto_id


async def _get_tipo_equipo_id(admin_client, equipo_id):
    resp = await admin_client.get(f"/productos/{equipo_id}")
    assert resp.status_code == 200, resp.text
    return resp.json()["tipo_producto_id"]


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
async def test_crear_garantia_con_monto_y_leerla(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={
            "instalacion_id": instalacion_id,
            "producto_id": equipo_id,
            "monto_garantia": 15000.5,
        },
    )
    assert creada.status_code == 200, creada.text
    data = creada.json()
    assert data["monto_garantia"] == 15000.5
    assert data["cliente_nombre"]
    assert data["cliente_apellido"]

    leida = await admin_client.get(f"/instalaciones/garantias/{data['garantia_id']}")
    assert leida.status_code == 200, leida.text
    assert leida.json()["monto_garantia"] == 15000.5


@pytest.mark.anyio
async def test_crear_garantia_monto_negativo_422(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    response = await admin_client.post(
        "/instalaciones/garantias",
        json={
            "instalacion_id": instalacion_id,
            "producto_id": equipo_id,
            "monto_garantia": -100,
        },
    )
    assert response.status_code == 422, response.text


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
# UPDATE / CICLO DE VIDA DEL DEPOSITO
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
async def test_corregir_garantia_anulada_ok(admin_client, db_conn):
    """Una ANULADA es un error de carga: debe poder corregirse (ya no es terminal)."""
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
            "resolucion_garantia": "Anulada por error",
        },
    )
    assert anular.status_code == 200, anular.text

    correccion = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"motivo_garantia": "Corrección de carga"},
    )
    assert correccion.status_code == 200, correccion.text
    assert correccion.json()["motivo_garantia"] == "Corrección de carga"


@pytest.mark.anyio
async def test_retener_garantia_requiere_resolucion_y_luego_ok(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id, "monto_garantia": 2000},
    )
    assert creada.status_code == 200, creada.text
    garantia_id = creada.json()["garantia_id"]

    sin_resolucion = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"estado_garantia_id": ESTADO_RETENIDA},
    )
    assert sin_resolucion.status_code == 422, sin_resolucion.text

    con_resolucion = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={
            "estado_garantia_id": ESTADO_RETENIDA,
            "resolucion_garantia": "Equipo no devuelto",
        },
    )
    assert con_resolucion.status_code == 200, con_resolucion.text
    data = con_resolucion.json()
    assert data["estado_garantia_id"] == ESTADO_RETENIDA
    assert data["fecha_fin_garantia"] is not None


@pytest.mark.anyio
async def test_devolver_garantia_ok(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id, "monto_garantia": 3000},
    )
    assert creada.status_code == 200, creada.text
    garantia_id = creada.json()["garantia_id"]

    devuelta = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"estado_garantia_id": ESTADO_DEVUELTA},
    )
    assert devuelta.status_code == 200, devuelta.text
    data = devuelta.json()
    assert data["estado_garantia_id"] == ESTADO_DEVUELTA
    assert data["fecha_fin_garantia"] is not None


@pytest.mark.anyio
async def test_reactivar_garantia_duplicada_409(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    primera = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert primera.status_code == 200, primera.text
    primera_id = primera.json()["garantia_id"]

    anular = await admin_client.patch(
        f"/instalaciones/garantias/{primera_id}",
        json={"estado_garantia_id": ESTADO_ANULADA, "resolucion_garantia": "Error de carga"},
    )
    assert anular.status_code == 200, anular.text

    # Con la primera anulada, se puede abrir una nueva ACTIVA para el mismo equipo.
    segunda = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert segunda.status_code == 200, segunda.text

    # Reactivar la primera choca con la segunda (ya ACTIVA para el mismo equipo) → 409, no 500.
    reactivar = await admin_client.patch(
        f"/instalaciones/garantias/{primera_id}",
        json={"estado_garantia_id": ESTADO_ACTIVA},
    )
    assert reactivar.status_code == 409, reactivar.text


@pytest.mark.anyio
async def test_alta_sin_fecha_fin_y_se_completa_al_editar(admin_client, db_conn):
    """Flujo de uso: el depósito se registra sin cierre y la fecha de fin se
    carga después, editando el ítem."""
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={
            "instalacion_id": instalacion_id,
            "producto_id": equipo_id,
            "monto_garantia": 45000,
        },
    )
    assert creada.status_code == 200, creada.text
    garantia_id = creada.json()["garantia_id"]
    assert creada.json()["fecha_fin_garantia"] is None
    assert creada.json()["estado_garantia_id"] == ESTADO_ACTIVA

    # Se agrega la fecha de fin después, sin tocar el estado.
    editada = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"fecha_fin_garantia": "2027-06-30T12:00:00Z"},
    )
    assert editada.status_code == 200, editada.text
    assert editada.json()["estado_garantia_id"] == ESTADO_ACTIVA
    assert editada.json()["fecha_fin_garantia"] is not None

    # Y persiste en una lectura posterior.
    releida = await admin_client.get(f"/instalaciones/garantias/{garantia_id}")
    assert releida.json()["fecha_fin_garantia"] == editada.json()["fecha_fin_garantia"]


@pytest.mark.anyio
async def test_editar_activa_no_borra_fecha_fin(admin_client, db_conn):
    """Corregir el monto de una garantía ACTIVA no debe tocarle la fecha de fin."""
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert creada.status_code == 200, creada.text
    garantia_id = creada.json()["garantia_id"]

    con_fin = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"fecha_fin_garantia": "2030-12-29T10:00:00Z"},
    )
    assert con_fin.status_code == 200, con_fin.text
    fecha_fin = con_fin.json()["fecha_fin_garantia"]
    assert fecha_fin is not None

    # Edición que NO menciona fechas ni estado.
    solo_monto = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"monto_garantia": 45000},
    )
    assert solo_monto.status_code == 200, solo_monto.text
    assert solo_monto.json()["monto_garantia"] == 45000
    assert solo_monto.json()["fecha_fin_garantia"] == fecha_fin


@pytest.mark.anyio
async def test_reabrir_garantia_limpia_el_cierre(admin_client, db_conn):
    """Reabrir (DEVUELTA → ACTIVA) sí descarta el cierre anterior."""
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    garantia_id = creada.json()["garantia_id"]

    devuelta = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"estado_garantia_id": ESTADO_DEVUELTA},
    )
    assert devuelta.status_code == 200, devuelta.text
    assert devuelta.json()["fecha_fin_garantia"] is not None

    reabierta = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"estado_garantia_id": ESTADO_ACTIVA},
    )
    assert reabierta.status_code == 200, reabierta.text
    assert reabierta.json()["estado_garantia_id"] == ESTADO_ACTIVA
    assert reabierta.json()["fecha_fin_garantia"] is None


# ==========================================================
# RESUMEN
# ==========================================================

@pytest.mark.anyio
async def test_resumen_garantias_cero_cuando_no_hay_devueltas_ni_retenidas(admin_client, db_conn):
    response = await admin_client.get("/instalaciones/garantias/resumen")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["comprometido"] == 0.0
    assert data["devuelto"] == 0.0
    assert data["retenido"] == 0.0


@pytest.mark.anyio
async def test_resumen_garantias_con_varios_estados(admin_client, db_conn):
    instalacion_id, equipo1_id, _ = _setup_equipo_en_instalacion(db_conn)
    tipo_equipo_id = await _get_tipo_equipo_id(admin_client, equipo1_id)
    equipo2_id = _agregar_otro_equipo(db_conn, instalacion_id, tipo_equipo_id, "Router Fibra 2")
    equipo3_id = _agregar_otro_equipo(db_conn, instalacion_id, tipo_equipo_id, "Router Fibra 3")

    antes = await admin_client.get("/instalaciones/garantias/resumen")
    assert antes.status_code == 200, antes.text
    antes_data = antes.json()

    # equipo1: queda ACTIVA (comprometido).
    activa = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo1_id, "monto_garantia": 1000},
    )
    assert activa.status_code == 200, activa.text

    # equipo2: se retiene.
    retenida = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo2_id, "monto_garantia": 2000},
    )
    assert retenida.status_code == 200, retenida.text
    patch_retenida = await admin_client.patch(
        f"/instalaciones/garantias/{retenida.json()['garantia_id']}",
        json={"estado_garantia_id": ESTADO_RETENIDA, "resolucion_garantia": "Equipo dañado"},
    )
    assert patch_retenida.status_code == 200, patch_retenida.text

    # equipo3: se devuelve.
    devuelta = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo3_id, "monto_garantia": 3000},
    )
    assert devuelta.status_code == 200, devuelta.text
    patch_devuelta = await admin_client.patch(
        f"/instalaciones/garantias/{devuelta.json()['garantia_id']}",
        json={"estado_garantia_id": ESTADO_DEVUELTA},
    )
    assert patch_devuelta.status_code == 200, patch_devuelta.text

    despues = await admin_client.get("/instalaciones/garantias/resumen")
    assert despues.status_code == 200, despues.text
    despues_data = despues.json()

    assert despues_data["comprometido"] - antes_data["comprometido"] == pytest.approx(1000.0)
    assert despues_data["cantidad_activas"] - antes_data["cantidad_activas"] == 1
    assert despues_data["retenido"] - antes_data["retenido"] == pytest.approx(2000.0)
    assert despues_data["devuelto"] - antes_data["devuelto"] == pytest.approx(3000.0)


@pytest.mark.anyio
async def test_resumen_garantias_tecnico_403(tecnico_client):
    response = await tecnico_client.get("/instalaciones/garantias/resumen")
    assert response.status_code == 403, response.text


@pytest.mark.anyio
async def test_update_garantia_fecha_fin_anterior_a_inicio_422(admin_client, db_conn):
    """chk_garantia_fechas se valida en el service: si llega a la DB sale 500."""
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)

    creada = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert creada.status_code == 200, creada.text
    garantia_id = creada.json()["garantia_id"]
    inicio = creada.json()["fecha_inicio_garantia"]

    res = await admin_client.patch(
        f"/instalaciones/garantias/{garantia_id}",
        json={"fecha_fin_garantia": "2000-01-01T00:00:00Z"},
    )

    assert res.status_code == 422, res.text
    # La garantía no quedó tocada.
    despues = (await admin_client.get(f"/instalaciones/garantias/{garantia_id}")).json()
    assert despues["fecha_inicio_garantia"] == inicio
    assert despues["fecha_fin_garantia"] is None
