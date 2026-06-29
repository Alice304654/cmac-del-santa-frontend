"""Schemas pydantic para autenticación."""
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., examples=["60105521"])
    password: str = Field(..., examples=["123456"])


class ClienteInfo(BaseModel):
    codcliente: str
    nombre: str
    pkcliente: int


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_min: int
    cliente: ClienteInfo


class RegistroRequest(BaseModel):
    username: str
    password: str


class RegistroResponse(BaseModel):
    mensaje: str
    dni: str
