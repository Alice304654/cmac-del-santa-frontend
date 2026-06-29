"""Router de operaciones (pago de cuota, transferencia, pago de servicios)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.engine import Connection

from app.controllers import ctrl_operaciones
from app.core.cfg_auth import get_cliente, verificar_token_y_rol
from app.core.cfg_database import get_db
from app.schemas.sch_operaciones import (
    PagoCuotaRequest,
    PagoCuotaResponse,
    PagoServicioRequest,
    PagoServicioResponse,
    ServicioOut,
    TransferenciaRequest,
    TransferenciaResponse,
    GestionCobranzaCreate,
    TransicionMoraRequest, 
    BandasMoraResponse
)

# Router de operaciones del cliente (homebanking)
router_operaciones = APIRouter(prefix="/operaciones", tags=["operaciones"], dependencies=[Depends(get_cliente)])

@router_operaciones.post("/pago-cuota", response_model=PagoCuotaResponse)
def pago_cuota(
    body: PagoCuotaRequest,
    conn: Connection = Depends(get_db),
    cliente: dict = Depends(get_cliente),
):
    return ctrl_operaciones.pago_cuota(
        conn, cliente["pkcliente"], body.codcuentacredito, body.monto, body.cuenta_origen
    )

@router_operaciones.post("/transferencia", response_model=TransferenciaResponse)
def transferencia(
    body: TransferenciaRequest,
    conn: Connection = Depends(get_db),
    cliente: dict = Depends(get_cliente),
):
    return ctrl_operaciones.transferencia(
        conn, cliente["pkcliente"], body.cuenta_origen, body.cuenta_destino, body.monto
    )

@router_operaciones.get("/servicios", response_model=list[ServicioOut])
def servicios(cliente: dict = Depends(get_cliente)):
    return ctrl_operaciones.listar_servicios()

@router_operaciones.post("/pago-servicio", response_model=PagoServicioResponse)
def pago_servicio(
    body: PagoServicioRequest,
    conn: Connection = Depends(get_db),
    cliente: dict = Depends(get_cliente),
):
    return ctrl_operaciones.pago_servicio(
        conn, cliente["pkcliente"], body.cuenta_origen, body.codservicio, body.codsuministro, body.monto
    )


# Router de recuperaciones / mora (personal del banco)
router = APIRouter(prefix="/recuperaciones", tags=["Módulo de Mora y Cobranzas"])

@router.get("/mora", response_model=BandasMoraResponse)
def consultar_bandas_y_kpis(token_data: dict = Depends(verificar_token_y_rol), conn: Connection = Depends(get_db)):
    if token_data["rol"] not in ['Asesor', 'Jefe Regional', 'Riesgos', 'Comité de Gerencia']:
        raise HTTPException(status_code=403, detail="Acceso denegado: Información reservada del banco.")
    return ctrl_operaciones.procesar_cartera_morosa_agrupada(conn)

@router.post("/gestionar", status_code=status.HTTP_201_CREATED)
def registrar_accion_cobranza(body: GestionCobranzaCreate, token_data: dict = Depends(verificar_token_y_rol), conn: Connection = Depends(get_db)):
    if token_data["rol"] not in ['Asesor', 'Jefe Regional']:
        raise HTTPException(status_code=403, detail="Acceso denegado: Su rol no posee permisos de gestor de cobranzas.")
    return ctrl_operaciones.registrar_gestion_cobranza(conn, body, ejecutor=token_data["username"])

@router.post("/cambiar-estado")
def procesar_pase_mora_critico(body: TransicionMoraRequest, token_data: dict = Depends(verificar_token_y_rol), conn: Connection = Depends(get_db)):
    return ctrl_operaciones.ejecutar_transicion_estado_critico(conn, body, rol_usuario=token_data["rol"])
