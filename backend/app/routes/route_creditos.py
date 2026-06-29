from app.controllers import ctrl_creditos
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.engine import Connection
from typing import List

from app.core.cfg_database import get_db
from app.core.cfg_auth import verificar_token_y_rol
from app.schemas.sch_creditos import (
    SolicitudCreditoCreate, 
    SolicitudCreditoResponse, 
    EvaluacionCreditoUpdate,
    DesembolsoRequest
)

# 💡 ESTA ES LA LÍNEA QUE FALTA DE DECLARAR:
router = APIRouter(prefix="/creditos", tags=["Core Bancario - Créditos"])

# Así debe verse la declaración real de la función (sin los tres puntos sueltos)
@router.patch("/core/evaluar/{credito_id}")
async def evaluar_credito(credito_id: int, estado: str):
    return ctrl_creditos.evaluar_credito(
        credito_id,
        estado
    )

@router.get("/historial")
def ver_historial(token_data: dict = Depends(verificar_token_y_rol), conn: Connection = Depends(get_db)):
    return ctrl_creditos.listar_historial_creditos(conn, usuario_id=token_data["id"], rol=token_data["rol"])

@router.post("/solicitar", response_model=SolicitudCreditoResponse, status_code=status.HTTP_201_CREATED)
def crear_solicitud(body: SolicitudCreditoCreate, token_data: dict = Depends(verificar_token_y_rol), conn: Connection = Depends(get_db)):
    # Usamos el cliente_id verificado en el token por seguridad
    return ctrl_creditos.evaluar_y_registrar_solicitud(conn, body, cliente_id=token_data["id"])

@router.post("/evaluar")
def dictaminar_solicitud(body: EvaluacionCreditoUpdate, token_data: dict = Depends(verificar_token_y_rol), conn: Connection = Depends(get_db)):
    # RBAC: Validamos que solo personal autorizado del banco pueda aprobar o rechazar
    if token_data["rol"] not in ['Asesor', 'Jefe Regional', 'Riesgos', 'Comité de Gerencia']:
        raise HTTPException(status_code=403, detail="Acceso denegado: Rol no autorizado para dictaminar deudas.")
    return ctrl_creditos.actualizar_dictamen_credito(conn, body)

@router.post("/desembolsar/{credito_id}")
def procesar_desembolso(credito_id: int, body: DesembolsoRequest, token_data: dict = Depends(verificar_token_y_rol), conn: Connection = Depends(get_db)):
    if token_data["rol"] not in ['Asesor', 'Jefe Regional']:
        raise HTTPException(status_code=403, detail="Acceso denegado: Operación reservada para el personal de agencia.")
    return ctrl_creditos.ejecutar_desembolso_flujo_completo(conn, credito_id, body.cuenta_destino_id)