"""/health responde a GET y a HEAD.

El monitor externo (UptimeRobot, plan gratuito) solo chequea con HEAD; si el
endpoint aceptara solo GET respondería 405 y el monitor daría el sistema por
caído. No usa la base: no depende de los fixtures de la suite.
"""
import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.anyio
async def test_health_get():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_health_head():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.head("/health")
    assert r.status_code == 200
    assert r.content == b""
