import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auditoria import router as auditoria_router
from app.routes.auth import router as auth_router
from app.routes.catalogos import router as catalogos_router
from app.routes.clientes import router as clientes_router
from app.routes.compras import router as compras_router
from app.routes.contratos import router as contratos_router
from app.routes.domicilios import router as domicilios_router
from app.routes.instalaciones import router as instalaciones_router
from app.routes.pagos import router as pagos_router
from app.routes.planes import router as planes_router
from app.routes.productos import router as productos_router
from app.routes.promociones import router as promociones_router
from app.routes.proveedores import router as proveedores_router
from app.routes.stock import router as stock_router
from app.routes.usuarios import router as usuarios_router

app = FastAPI(title="Sistema RED API")

# Orígenes permitidos por CORS. Configurable por ambiente vía CORS_ORIGINS
# (lista separada por comas). Default = front de DEV.
origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(clientes_router)
app.include_router(domicilios_router)
app.include_router(contratos_router)
app.include_router(pagos_router)
app.include_router(catalogos_router)
app.include_router(instalaciones_router)
app.include_router(planes_router)
app.include_router(productos_router)
app.include_router(promociones_router)
app.include_router(proveedores_router)
app.include_router(compras_router)
app.include_router(stock_router)
app.include_router(auditoria_router)
