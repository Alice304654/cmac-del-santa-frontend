from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.engine import Connection
from sqlalchemy import text
from ..schemas.sch_creditos import (
    SolicitudCreditoCreate,
    EstadoCredito,
    EvaluacionCreditoUpdate,
    BandaMora,
    GestionCobranzaCreate
)

router = APIRouter(
    prefix="/creditos",
    tags=["Core Financiero & Homebanking"]
)

MONTO_COMITE = 50000
ROLES_EVALUACION = ["asesor", "riesgos", "comite"]

# =========================
# BASE DE DATOS SIMULADA
# =========================

BD_SOLICITUDES = []

BD_CUENTAS = {
    1: {
        "numero": "315-02-41",
        "saldo": 2500.0,
        "usuario_id": 100,
        "estado": "activa"
    }
}

BD_GESTIONES_COBRANZA = []
BD_MOVIMIENTOS_COBRANZA = []

# =========================
# JWT SIMULADO
# =========================

def obtener_rol_jwt(token: str):
    if token == "token-cliente":
        return {"rol": "cliente", "usuario_id": 100}

    if token == "token-asesor":
        return {"rol": "asesor", "usuario_id": 1}

    if token == "token-riesgos":
        return {"rol": "riesgos", "usuario_id": 2}

    if token == "token-comite":
        return {"rol": "comite", "usuario_id": 3}

    raise HTTPException(
        status_code=401,
        detail="Token inválido"
    )

def listar_historial_creditos(conn: Connection, usuario_id: int, rol: str):
    try:
        if rol == "Cliente":
            query = text("""
                SELECT id, id AS codcuentacredito, tipo_credito AS tipo, 
                       monto_solicitado AS monto, plazo_meses AS plazototal, estado
                FROM creditos WHERE cliente_id = :cliente_id ORDER BY id DESC;
            """)
            return conn.execute(query, {"cliente_id": usuario_id}).mappings().all()
        else:
            query = text("""
                SELECT id, id AS codcuentacredito, tipo_credito AS tipo, monto_solicitado AS monto, 
                       plazo_meses AS plazototal, rds_calculado AS rds, estado, semaforo, nivel_aprobacion
                FROM creditos ORDER BY id DESC;
            """)
            return conn.execute(query).mappings().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar créditos: {str(e)}")

def evaluar_y_registrar_solicitud(conn: Connection, body: SolicitudCreditoCreate, cliente_id: int):
    # Regla: Evitar solicitudes duplicadas en evaluación simultánea
    q_verificar = text("SELECT id FROM creditos WHERE cliente_id = :cliente_id AND estado = 'en_evaluacion';")
    if conn.execute(q_verificar, {"cliente_id": cliente_id}).first():
        raise HTTPException(status_code=400, detail="El cliente ya cuenta con una solicitud de crédito en proceso.")

    # 🧮 Lógica Financiera Obligatoria (Fórmula Francesa) [cite: 18]
    tea = 0.35
    tem = (1 + tea) ** (1 / 12) - 1  
    cuota_mensual = (body.monto_solicitado * tem) / (1 - (1 + tem) ** (-body.plazo_meses))

    # Cálculo del RDS consolidado (Ratio de Endeudamiento) 
    carga_financiera_total = cuota_mensual + body.obligaciones_financieras
    rds = (carga_financiera_total / body.ingreso_neto_mensual) * 100

    # 🚦 Matriz del Semáforo de Riesgo y Canales de Aprobación (Criterio 2) 
    if rds > 45.00:
        semaforo, estado_inicial, nivel_aprobacion = "Rojo", "rechazado", "Ninguno"
    elif rds > 30.00:
        semaforo, estado_inicial, nivel_aprobacion = "Ámbar", "en_evaluacion", "Riesgos / Comité"
    else:
        semaforo, estado_inicial, nivel_aprobacion = "Verde", "en_evaluacion", "Asesor"

    # Escalamiento jerárquico normado por montos 
    if semaforo != "Rojo":
        if body.monto_solicitado > 50000: 
            nivel_aprobacion = "Comité de Gerencia"
        elif body.monto_solicitado > 15000: 
            nivel_aprobacion = "Jefe Regional"

    q_insert = text("""
        INSERT INTO creditos (cliente_id, monto_solicitado, plazo_meses, cuota_mensual, estado, semaforo, rds_calculado, nivel_aprobacion, tipo_credito)
        VALUES (:cliente_id, :monto, :plazo, :cuota, :estado, :semaforo, :rds, :nivel, 'Consumo Unificado');
    """)
    conn.execute(q_insert, {
        "cliente_id": cliente_id, "monto": body.monto_solicitado, "plazo": body.plazo_meses, 
        "cuota": cuota_mensual, "estado": estado_inicial, "semaforo": semaforo, "rds": rds, "nivel": nivel_aprobacion
    })
    
    conn.commit()  # Requerido por el esquema "commit as you go" del proyecto
    return {
        "status": "Procesado", "decision_inicial": estado_inicial, "semaforo": semaforo,
        "rds_calculado": f"{rds:.2f}%", "cuota_estimada": f"S/ {cuota_mensual:.2f}", "instancia_aprobacion": nivel_aprobacion
    }

def actualizar_dictamen_credito(conn: Connection, body: EvaluacionCreditoUpdate):
    query = text("UPDATE creditos SET estado = :estado, observaciones = :obs WHERE id = :id;")
    conn.execute(query, {"estado": body.nuevo_estado.value, "obs": body.observaciones, "id": body.credito_id})
    conn.commit()
    return {"status": "Éxito", "mensaje": f"El estado del crédito se actualizó a {body.nuevo_estado.value}."}

def ejecutar_desembolso_flujo_completo(conn: Connection, credito_id: int, cuenta_destino_id: int):
    # Verificar elegibilidad de desembolso 
    q_credito = text("SELECT * FROM creditos WHERE id = :id;")
    credito = conn.execute(q_credito, {"id": credito_id}).mappings().first()
    
    if not credito or credito['estado'] != 'aprobado':
        raise HTTPException(status_code=400, detail="El crédito no se encuentra en estado 'aprobado' para ser desembolsado.")
    
    monto = float(credito['monto_solicitado'])
    nuevo_codigo_bancario = f"CR-SANTA{1000 + credito_id}"
    
    # 💥 CRUCIAL: Sincronización e Integración Core-Homebanking (Criterio 1) [cite: 13, 14]
    # 1. Actualiza el estado del crédito en el Core
    conn.execute(text("UPDATE creditos SET estado = 'desembolsado', codigo_credito = :codigo WHERE id = :id;"), {"codigo": nuevo_codigo_bancario, "id": credito_id})
    # 2. Modifica el saldo disponible del cliente en su Homebanking
    conn.execute(text("UPDATE cuentas_ahorro SET saldo = saldo + :monto WHERE id = :cuenta_id;"), {"monto": monto, "cuenta_id": cuenta_destino_id})
    # 3. Alimenta el historial de movimientos de forma automática
    conn.execute(text("INSERT INTO movimientos_cuenta (cuenta_id, tipo_movimiento, monto, descripcion) VALUES (:cuenta_id, 'Desembolso', :monto, :desc);"), 
                 {"cuenta_id": cuenta_destino_id, "monto": monto, "desc": f"Desembolso Efectivo Préstamo {nuevo_codigo_bancario}"})
    
    conn.commit()
    return {"message": "¡Desembolso completado con éxito! Integración y saldos reflejados en el acto."}
# ==================================================
# HOMEBANKING
# ==================================================

@router.post("/solicitar")
async def solicitar_credito(
    payload: SolicitudCreditoCreate,
    token: str = "token-cliente"
):
    user = obtener_rol_jwt(token)

    if user["rol"] != "cliente":
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado"
        )

    score = 700

    if payload.ingreso_neto_mensual < 1500:
        score -= 100

    if payload.obligaciones_financieras > 1000:
        score -= 100

    if score < 500:
        raise HTTPException(
            status_code=400,
            detail="Score crediticio insuficiente"
        )

    rds = (
        payload.obligaciones_financieras +
        (payload.monto_solicitado / payload.plazo_meses)
    ) / payload.ingreso_neto_mensual

    semaforo = (
        "ROJO" if rds > 0.40
        else "AMARILLO" if rds > 0.30
        else "VERDE"
    )

    if semaforo == "ROJO":
        raise HTTPException(
            status_code=400,
            detail="Solicitud rechazada automáticamente por scoring: Capacidad de pago insuficiente."
        )

    nueva_solicitud = {
        "id": len(BD_SOLICITUDES) + 1,
        "usuario_id": user["usuario_id"],
        "cuenta_id": payload.cuenta_id,
        "monto": payload.monto_solicitado,
        "plazo": payload.plazo_meses,
        "rds": round(rds, 2),
        "semaforo_rds": semaforo,
        "estado": EstadoCredito.ENVIADO,
        "dias_mora": 0,
        "fecha_creacion": datetime.now(),
        "score": score
    }

    BD_SOLICITUDES.append(nueva_solicitud)

    return nueva_solicitud

# ==================================================
# CORE BANCARIO
# ==================================================

@router.get("/core/bandeja")
async def bandeja_solicitudes(
    token: str = "token-asesor"
):
    user = obtener_rol_jwt(token)

    if user["rol"] not in ROLES_EVALUACION:
        raise HTTPException(
            status_code=403,
            detail="No autorizado para ver la bandeja interna"
        )

    return BD_SOLICITUDES


@router.patch("/core/evaluar/{credito_id}")
async def evaluar_credito(
    credito_id: int,
    payload: EvaluacionCreditoUpdate,
    token: str = "token-riesgos"
):
    user = obtener_rol_jwt(token)

    credito = next(
        (c for c in BD_SOLICITUDES if c["id"] == credito_id),
        None
    )

    if not credito:
        raise HTTPException(
            status_code=404,
            detail="Crédito no encontrado"
        )

    if payload.nuevo_estado == EstadoCredito.APROBADO:

        if (
            credito["monto"] > MONTO_COMITE
            and user["rol"] != "comite"
        ):
            raise HTTPException(
                status_code=403,
                detail="Requiere aprobación del Comité."
            )

        if (
            credito["monto"] <= MONTO_COMITE
            and user["rol"] not in ["riesgos", "comite"]
        ):
            raise HTTPException(
                status_code=403,
                detail="Requiere aprobación de Riesgos."
            )

    if payload.nuevo_estado == EstadoCredito.DESEMBOLSADO:

        if credito["estado"] != EstadoCredito.APROBADO:
            raise HTTPException(
                status_code=400,
                detail="El crédito debe estar aprobado."
            )

        cuenta_id = credito["cuenta_id"]

        if cuenta_id in BD_CUENTAS:

            BD_CUENTAS[cuenta_id]["saldo"] += credito["monto"]

            movimiento = {
                "tipo": "DESEMBOLSO_CREDITO",
                "cuenta_id": cuenta_id,
                "monto": credito["monto"],
                "fecha": datetime.now()
            }

            BD_MOVIMIENTOS_COBRANZA.append(movimiento)

    credito["estado"] = payload.nuevo_estado
    credito["fecha_evaluacion"] = datetime.now()
    credito["evaluado_por"] = user["rol"]

    return credito

# ==================================================
# RECUPERACIONES
# ==================================================

@router.get("/core/recuperaciones/bandas")
async def consulta_por_bandas(
    token: str = "token-asesor"
):
    user = obtener_rol_jwt(token)

    if user["rol"] not in ["asesor", "riesgos"]:
        raise HTTPException(
            status_code=403,
            detail="Permisos insuficientes"
        )

    bandas = {
        BandaMora.PREVENTIVA: [],
        BandaMora.TEMPRANA: [],
        BandaMora.TARDIA: [],
        BandaMora.JUDICIAL: [],
        BandaMora.CASTIGO: []
    }

    for c in BD_SOLICITUDES:

        if c["estado"] == EstadoCredito.DESEMBOLSADO:

            dias = c["dias_mora"]

            if dias == 0:
                bandas[BandaMora.PREVENTIVA].append(c)

            elif 1 <= dias <= 30:
                bandas[BandaMora.TEMPRANA].append(c)

            elif 31 <= dias <= 120:
                bandas[BandaMora.TARDIA].append(c)

            elif 121 <= dias <= 180:
                bandas[BandaMora.JUDICIAL].append(c)

            elif dias > 180:
                bandas[BandaMora.CASTIGO].append(c)

    return bandas


@router.post("/core/recuperaciones/gestionar")
async def registrar_gestion_cobranza(
    payload: GestionCobranzaCreate,
    token: str = "token-asesor"
):
    obtener_rol_jwt(token)

    nueva_gestion = {
        "id": len(BD_GESTIONES_COBRANZA) + 1,
        "credito_id": payload.credito_id,
        "compromiso_pago": payload.compromiso_pago,
        "fecha_compromiso": payload.fecha_compromiso,
        "comentario": payload.comentario,
        "fecha_registro": datetime.now()
    }

    BD_GESTIONES_COBRANZA.append(nueva_gestion)

    return {
        "status": "success",
        "gestion": nueva_gestion
    }


@router.patch("/core/recuperaciones/transicionar/{credito_id}")
async def transicionar_mora_critica(
    credito_id: int,
    nuevo_estado: EstadoCredito,
    token: str = "token-comite"
):
    user = obtener_rol_jwt(token)

    credito = next(
        (c for c in BD_SOLICITUDES if c["id"] == credito_id),
        None
    )

    if not credito:
        raise HTTPException(
            status_code=404,
            detail="Crédito no encontrado"
        )

    if (
        nuevo_estado == EstadoCredito.JUDICIAL
        and credito["dias_mora"] < 121
    ):
        raise HTTPException(
            status_code=400,
            detail="No cumple umbral para Judicial."
        )

    if nuevo_estado == EstadoCredito.CASTIGO:

        if user["rol"] != "comite":
            raise HTTPException(
                status_code=403,
                detail="Solo el Comité puede castigar deudas."
            )

        if credito["dias_mora"] <= 180:
            raise HTTPException(
                status_code=400,
                detail="No cumple el umbral para Castigo."
            )

    credito["estado"] = nuevo_estado

    return credito