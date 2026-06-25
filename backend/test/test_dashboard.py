# backend/test/test_dashboard.py

import pytest


# ==========================================================
# CLIENTES /resumen
# ==========================================================

@pytest.mark.anyio
async def test_clientes_resumen_ok(admin_client):
    response = await admin_client.get("/clientes/resumen")

    assert response.status_code == 200, response.text
    data = response.json()
    assert set(data.keys()) == {"total", "activos", "inactivos"}
    # estado_cliente sólo tiene ACTIVO/INACTIVO → el total cierra.
    assert data["total"] == data["activos"] + data["inactivos"]


@pytest.mark.anyio
async def test_clientes_resumen_tecnico_403(tecnico_client):
    # Lectura de clientes: ADMIN/OPERADOR/COBRANZAS. TECNICO queda fuera.
    response = await tecnico_client.get("/clientes/resumen")
    assert response.status_code == 403, response.text


# ==========================================================
# CONTRATOS /resumen
# ==========================================================

@pytest.mark.anyio
async def test_contratos_resumen_ok(admin_client):
    response = await admin_client.get("/contratos/resumen")

    assert response.status_code == 200, response.text
    data = response.json()
    assert set(data.keys()) == {"total", "por_estado"}
    assert set(data["por_estado"].keys()) == {
        "BORRADOR",
        "PENDIENTE_INSTALACION",
        "ACTIVO",
        "SUSPENDIDO",
        "BAJA",
        "CANCELADO",
    }
    assert data["total"] == sum(data["por_estado"].values())


@pytest.mark.anyio
async def test_contratos_resumen_cobranzas_ok(cobranzas_client):
    # COBRANZAS tiene lectura de contratos.
    response = await cobranzas_client.get("/contratos/resumen")
    assert response.status_code == 200, response.text


# ==========================================================
# INSTALACIONES /resumen
# ==========================================================

@pytest.mark.anyio
async def test_instalaciones_resumen_ok(admin_client):
    response = await admin_client.get("/instalaciones/resumen")

    assert response.status_code == 200, response.text
    data = response.json()
    assert set(data.keys()) == {
        "pendientes",
        "fallidas",
        "programadas_hoy",
        "agenda_hoy",
    }
    assert isinstance(data["agenda_hoy"], list)
    # La agenda no excede el número de programadas de hoy (limit 8).
    assert len(data["agenda_hoy"]) <= data["programadas_hoy"]


@pytest.mark.anyio
async def test_instalaciones_resumen_tecnico_ok(tecnico_client):
    response = await tecnico_client.get("/instalaciones/resumen")
    assert response.status_code == 200, response.text


@pytest.mark.anyio
async def test_instalaciones_resumen_cobranzas_403(cobranzas_client):
    # Instalaciones: ADMIN/OPERADOR/TECNICO. COBRANZAS queda fuera.
    response = await cobranzas_client.get("/instalaciones/resumen")
    assert response.status_code == 403, response.text


# ==========================================================
# PAGOS /resumen
# ==========================================================

@pytest.mark.anyio
async def test_pagos_resumen_ok(cobranzas_client):
    response = await cobranzas_client.get("/pagos/resumen")

    assert response.status_code == 200, response.text
    data = response.json()
    assert set(data.keys()) == {
        "deudores_count",
        "monto_adeudado",
        "facturado_mes",
        "pagos_pendientes_mes",
        "pagos_parciales_mes",
        "top_morosos",
    }
    assert isinstance(data["top_morosos"], list)
    # top_morosos lista a los deudores (cap 8).
    assert len(data["top_morosos"]) <= data["deudores_count"]


@pytest.mark.anyio
async def test_pagos_resumen_operador_403(operador_client):
    # Pagos: ADMIN/COBRANZAS. OPERADOR queda fuera.
    response = await operador_client.get("/pagos/resumen")
    assert response.status_code == 403, response.text
