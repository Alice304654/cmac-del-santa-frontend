"""Router de consultas de cuentas (ahorro y crédito). Todos exigen get_cliente."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.engine import Connection
from typing import List

from app.controllers import ctrl_cuentas
from app.core.cfg_auth import get_cliente, verificar_token_y_rol
from app.core.cfg_database import get_db
from app.schemas.sch_cuentas import (
    CuentaAhorroOut,
    CuentaCreditoOut,
    CuotaOut,
    DetalleAhorroResponse,
    MovimientoOut,
    CuentaResponse,
    MovimientoResponse
)

router = APIRouter(prefix="/cuentas", tags=["Homebanking - cuentas"], dependencies=[Depends(get_cliente)])

@router.get("/mis-cuentas", response_model=List[CuentaResponse])
def listar_cuentas(token_data: dict = Depends(verificar_token_y_rol), conn: Connection = Depends(get_db)):
    # Extrae el ID del cliente de forma segura desde el token JWT
    return ctrl_cuentas.obtener_cuentas_cliente(conn, cliente_id=token_data["id"])

@router.get("/movimientos/{cuenta_id}", response_model=List[MovimientoResponse])
def listar_movimientos(cuenta_id: int, token_data: dict = Depends(verificar_token_y_rol), conn: Connection = Depends(get_db)):
    return ctrl_cuentas.obtener_movimientos_cuenta(conn, cuenta_id=cuenta_id)

@router.get("/ahorro", response_model=list[CuentaAhorroOut])
def cuentas_ahorro(conn: Connection = Depends(get_db), cliente: dict = Depends(get_cliente)):
    return ctrl_cuentas.listar_ahorros(conn, cliente["pkcliente"])


@router.get("/ahorro/{codcuentaahorro}/movimientos", response_model=list[MovimientoOut])
def movimientos(
    codcuentaahorro: str,
    limit: int = Query(50, ge=1, le=500),
    conn: Connection = Depends(get_db),
    cliente: dict = Depends(get_cliente),
):
    return ctrl_cuentas.movimientos_ahorro(conn, cliente["pkcliente"], codcuentaahorro, limit)


@router.get("/ahorro/{codcuentaahorro}/detalle", response_model=DetalleAhorroResponse)
def detalle_ahorro(
    codcuentaahorro: str,
    conn: Connection = Depends(get_db),
    cliente: dict = Depends(get_cliente),
):
    return ctrl_cuentas.detalle_ahorro(conn, cliente["pkcliente"], codcuentaahorro)


@router.get("/credito", response_model=list[CuentaCreditoOut])
def cuentas_credito(conn: Connection = Depends(get_db), cliente: dict = Depends(get_cliente)):
    return ctrl_cuentas.listar_creditos(conn, cliente["pkcliente"])


@router.get("/credito/{codcuentacredito}/cuotas", response_model=list[CuotaOut])
def cuotas(
    codcuentacredito: str,
    conn: Connection = Depends(get_db),
    cliente: dict = Depends(get_cliente),
):
    return ctrl_cuentas.cuotas_credito(conn, cliente["pkcliente"], codcuentacredito)
