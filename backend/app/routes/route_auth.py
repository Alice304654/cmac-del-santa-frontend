"""Router de autenticación — Caja del Santa."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.engine import Connection
from pydantic import BaseModel

from app.controllers import ctrl_auth
from app.core.cfg_database import get_db
from app.schemas.sch_auth import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])

class RegistroRequest(BaseModel):
    username: str
    password: str

class RegistroResponse(BaseModel):
    mensaje: str
    dni: str

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, conn: Connection = Depends(get_db)):
    return ctrl_auth.login(conn, body.username, body.password)

# 💡 AGREGAMOS LA RUTA DE REGISTRO CONECTADA AL CONTROLADOR
@router.post("/registro", response_model=RegistroResponse, status_code=status.HTTP_201_CREATED)
def registro(body: RegistroRequest, conn: Connection = Depends(get_db)):
    resultado = ctrl_auth.registrar(conn, body.username, body.password)
    return RegistroResponse(
        mensaje=resultado["mensaje"],
        dni=resultado["dni"]
    )