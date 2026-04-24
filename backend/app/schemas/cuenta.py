from pydantic import BaseModel

class CuentaCreate(BaseModel):
    estado_cuenta_id: int

