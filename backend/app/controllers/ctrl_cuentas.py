from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from enum import Enum
from sqlalchemy.engine import Connection
from sqlalchemy import text

def obtener_cuentas_cliente(conn: Connection, cliente_id: int):
    try:
        query = text("""
            SELECT id, numero_cuenta, tipo_cuenta, saldo, moneda 
            FROM cuentas_ahorro 
            WHERE cliente_id = :cliente_id;
        """)
        return conn.execute(query, {"cliente_id": cliente_id}).mappings().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en base de datos al consultar cuentas: {str(e)}")

def obtener_movimientos_cuenta(conn: Connection, cuenta_id: int):
    try:
        query = text("""
            SELECT id, cuenta_id, tipo_movimiento, monto, descripcion, fecha_movimiento
            FROM movimientos_cuenta
            WHERE cuenta_id = :cuenta_id
            ORDER BY fecha_movimiento DESC;
        """)
        return conn.execute(query, {"cuenta_id": cuenta_id}).mappings().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar movimientos: {str(e)}")

class EstadoCuenta(str, Enum):
    ACTIVA = "activa"
    BLOQUEADA = "bloqueada"
    INACTIVA = "inactiva"

class AccionCuentaPayload(BaseModel):
    cuenta_id: int
    nuevo_estado: EstadoCuenta
    motivo_cambio: str

router = APIRouter(prefix="/cuentas", tags=["Core - Gestión de Cuentas"])

# ================= REQUERIMIENTO: OPERACIONES DE PORTAL INTEGRADO =================

@router.patch("/core/cambiar-estado")
async def administrar_estado_cuenta(payload: AccionCuentaPayload):
    """
    Core Bancario Interno: Permite la apertura, bloqueo por pérdida/fraude, 
    o activación vinculada al portal del cliente de la Caja.
    """
    # Aquí iría tu consulta a la base de datos (Ejm: repo_cuentas)
    # cuenta = await repo.obtener_por_id(payload.cuenta_id)
    
    if payload.cuenta_id == 0:
        raise HTTPException(status_code=404, detail="La cuenta especificada no existe en la Caja del Santa")

    # Simulación de estado actual
    estado_actual = "activa"

    if estado_actual == payload.nuevo_estado.value:
       raise HTTPException(
          status_code=400,
          detail="La cuenta ya se encuentra en el estado solicitado"
        )
        
    return {
        "status": "success",
        "message": f"La cuenta {payload.cuenta_id} ha pasado exitosamente al estado: {payload.nuevo_estado.value}",
        "auditoria": {
            "motivo": payload.motivo_cambio,
            "entidad": "CMAC DEL SANTA S.A."
        }
    }