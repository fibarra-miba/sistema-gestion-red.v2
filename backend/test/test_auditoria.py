# backend/test/test_auditoria.py

import pytest


TIPO_SERVICIO_ID = 1


def _producto_payload(**overrides):
    payload = {
        "nombre_producto": "Audit Router",
        "descripcion_producto": "Equipo de prueba",
        "marca_producto": "TP-Link",
        "modelo_producto": "AX-AUD",
        "tipo_producto_id": TIPO_SERVICIO_ID,
    }
    payload.update(overrides)
    return payload


# ==========================================================
# La acción de negocio deja un evento de auditoría
# ==========================================================

@pytest.mark.anyio
async def test_create_producto_genera_evento(admin_client):
    creado = await admin_client.post("/productos", json=_producto_payload())
    assert creado.status_code == 200, creado.text
    producto_id = creado.json()["producto_id"]

    res = await admin_client.get(
        "/auditoria", params={"modulo": "PRODUCTOS", "accion": "CREATE"}
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total"] >= 1

    evento = next(
        e for e in body["items"] if e["entidad_id_auditoria"] == str(producto_id)
    )
    assert evento["modulo_auditoria"] == "PRODUCTOS"
    assert evento["accion_auditoria"] == "CREATE"
    assert evento["entidad_auditoria"] == "productos"
    # El actor quedó registrado (admin logueado).
    assert evento["usuario_id"] is not None
    assert evento["username_usuario"] == "admin"


@pytest.mark.anyio
async def test_update_producto_genera_evento_update(admin_client):
    creado = await admin_client.post(
        "/productos",
        json=_producto_payload(modelo_producto="AX-UPD"),
    )
    assert creado.status_code == 200, creado.text
    producto_id = creado.json()["producto_id"]

    upd = await admin_client.patch(
        f"/productos/{producto_id}", json={"descripcion_producto": "cambiada"}
    )
    assert upd.status_code == 200, upd.text

    res = await admin_client.get(
        "/auditoria",
        params={"modulo": "PRODUCTOS", "accion": "UPDATE", "entidad_id": str(producto_id)},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total"] >= 1
    assert all(e["accion_auditoria"] == "UPDATE" for e in body["items"])
    assert all(e["entidad_id_auditoria"] == str(producto_id) for e in body["items"])


# ==========================================================
# Filtros del visor
# ==========================================================

@pytest.mark.anyio
async def test_filtro_por_modulo_aisla(admin_client):
    # Genera eventos en dos módulos distintos.
    await admin_client.post("/productos", json=_producto_payload(modelo_producto="AX-FILT"))
    plan = await admin_client.post(
        "/planes",
        json={
            "nombre_plan": "Plan Audit",
            "velocidad_mbps_plan": 100,
            "descripcion_plan": "x",
            "estado_plan_id": 1,
        },
    )
    assert plan.status_code == 200, plan.text

    solo_planes = await admin_client.get("/auditoria", params={"modulo": "PLANES"})
    assert solo_planes.status_code == 200, solo_planes.text
    assert solo_planes.json()["total"] >= 1
    assert all(
        e["modulo_auditoria"] == "PLANES" for e in solo_planes.json()["items"]
    )


@pytest.mark.anyio
async def test_paginacion_devuelve_total(admin_client):
    res = await admin_client.get("/auditoria", params={"limit": 1, "offset": 0})
    assert res.status_code == 200, res.text
    body = res.json()
    assert "total" in body
    assert len(body["items"]) <= 1


# ==========================================================
# Tipos (filtros canónicos)
# ==========================================================

@pytest.mark.anyio
async def test_tipos_devuelve_modulos_y_acciones(admin_client):
    res = await admin_client.get("/auditoria/tipos")
    assert res.status_code == 200, res.text
    body = res.json()
    assert "PRODUCTOS" in body["modulos"]
    assert "CONTRATOS" in body["modulos"]
    assert "CREATE" in body["acciones"]
    assert "MOVIMIENTO" in body["acciones"]


# ==========================================================
# ACL: visor solo ADMIN
# ==========================================================

@pytest.mark.anyio
async def test_visor_solo_admin(operador_client):
    res = await operador_client.get("/auditoria")
    assert res.status_code == 403, res.text


@pytest.mark.anyio
async def test_tipos_solo_admin(operador_client):
    res = await operador_client.get("/auditoria/tipos")
    assert res.status_code == 403, res.text
