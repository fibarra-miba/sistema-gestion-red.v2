from pydantic import BaseModel
from app.schemas.cliente import ClienteCreate
from app.schemas.domicilio import DomicilioCreate
from app.schemas.cuenta import CuentaCreate

class ClienteOnboardingCreate(BaseModel):
    cliente: ClienteCreate
    domicilio: DomicilioCreate
    cuenta: CuentaCreate

