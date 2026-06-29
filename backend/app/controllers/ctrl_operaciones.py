"""Controlador de operaciones: pago de cuota y transferencia entre cuentas propias."""
from decimal import Decimal
from sqlalchemy import text
from fastapi import HTTPException, status
from sqlalchemy.engine import Connection
from app.schemas.sch_operaciones import GestionCobranzaCreate, TransicionMoraRequest
from app.repositories import repo_cuentas, repo_operaciones


# Catálogo acotado de servicios (no existe tabla de empresas/billers en la BD: dconvenio vacío).
SERVICIOS = [
    {"codservicio": "LUZ", "nombre": "Electricidad"},
    {"codservicio": "AGUA", "nombre": "Agua potable y alcantarillado"},
    {"codservicio": "TEL", "nombre": "Telefonía / Internet"},
    {"codservicio": "CABLE", "nombre": "TV por cable"},
    {"codservicio": "GAS", "nombre": "Gas natural"},
    {"codservicio": "MUNI", "nombre": "Arbitrios municipales"},
]
_SERVICIOS_POR_COD = {s["codservicio"]: s for s in SERVICIOS}


def listar_servicios() -> list[dict]:
    return SERVICIOS


def pago_cuota(
    conn: Connection,
    pkcliente: int,
    codcuentacredito: str,
    monto: Decimal | None,
    cuenta_origen: str | None = None,
) -> dict:
    credito = repo_cuentas.buscar_cuenta_credito(conn, codcuentacredito)
    if credito is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crédito no encontrado")
    if credito["pkcliente"] != pkcliente:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="El crédito no pertenece al cliente"
        )
    if credito.get("pkagencia") is None or credito.get("pkmoneda") is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El crédito no tiene datos vigentes en la cartera del periodo",
        )
    if monto is not None and monto <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El monto debe ser > 0")

    # Si se paga desde una cuenta de ahorro, validar pertenencia y saldo suficiente.
    origen = None
    if cuenta_origen:
        origen = repo_cuentas.buscar_cuenta_ahorro(conn, cuenta_origen)
        if origen is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta de ahorro origen no encontrada"
            )
        if origen["pkcliente"] != pkcliente:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La cuenta de ahorro origen no pertenece al cliente",
            )
        # La validación de saldo vs. monto real de la cuota se hace en el repo (ValueError -> 409).

    try:
        res = repo_operaciones.pagar_cuota(conn, credito, monto, origen)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    return {
        "mensaje": "Pago de cuota registrado" + (" (debitado de ahorro)" if origen else ""),
        "codcuentacredito": codcuentacredito,
        "cuenta_origen": cuenta_origen.strip() if cuenta_origen else None,
        **res,
    }


def pago_servicio(
    conn: Connection,
    pkcliente: int,
    cuenta_origen: str,
    codservicio: str,
    codsuministro: str,
    monto: Decimal,
) -> dict:
    servicio = _SERVICIOS_POR_COD.get(codservicio.upper())
    if servicio is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Servicio '{codservicio}' no válido. Use GET /operaciones/servicios.",
        )
    origen = repo_cuentas.buscar_cuenta_ahorro(conn, cuenta_origen)
    if origen is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta de ahorro origen no encontrada")
    if origen["pkcliente"] != pkcliente:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="La cuenta de ahorro no pertenece al cliente"
        )
    if origen["saldo"] is None or origen["saldo"] < monto:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Saldo insuficiente en la cuenta de ahorro"
        )

    res = repo_operaciones.pagar_servicio(
        conn, origen, servicio["nombre"], codsuministro.strip(), monto
    )
    return {
        "mensaje": "Pago de servicio registrado",
        "servicio": servicio["nombre"],
        "codsuministro": codsuministro.strip(),
        "cuenta_origen": cuenta_origen.strip(),
        "monto": monto,
        **res,
    }


def transferencia(
    conn: Connection,
    pkcliente: int,
    cuenta_origen: str,
    cuenta_destino: str,
    monto: Decimal,
) -> dict:
    if cuenta_origen.strip() == cuenta_destino.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta origen y destino no pueden ser la misma",
        )

    origen = repo_cuentas.buscar_cuenta_ahorro(conn, cuenta_origen)
    destino = repo_cuentas.buscar_cuenta_ahorro(conn, cuenta_destino)
    if origen is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta origen no encontrada")
    if destino is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta destino no encontrada")

    if origen["pkcliente"] != pkcliente or destino["pkcliente"] != pkcliente:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ambas cuentas deben pertenecer al cliente",
        )
    if origen["saldo"] is None or origen["saldo"] < monto:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Saldo insuficiente en la cuenta origen"
        )

    res = repo_operaciones.transferir(conn, origen, destino, monto)
    return {
        "mensaje": "Transferencia registrada",
        "cuenta_origen": cuenta_origen.strip(),
        "cuenta_destino": cuenta_destino.strip(),
        "monto": monto,
        **res,
    }
def procesar_cartera_morosa_agrupada(conn: Connection):
    try:
        query = text("""
            SELECT id, cliente_id, monto_solicitado AS saldo_pendiente, dias_atraso, estado 
            FROM creditos 
            WHERE dias_atraso >= 0 AND estado IN ('desembolsado', 'judicial', 'castigo') 
            ORDER BY dias_atraso DESC;
        """)
        creditos = conn.execute(query).mappings().all()
        
        kpis = {"total_cartera_mora": 0.0, "clientes_en_riesgo": 0}
        bandas = {"Preventiva": [], "Temprana": [], "Tardía": [], "Judicial": [], "Castigo": []}
        
        for c in creditos:
            dias = c['dias_atraso']
            monto = float(c['saldo_pendiente'])
            
            # Clasificación matemática estricta por bandas normativas (R1) [cite: 30]
            if c['estado'] == 'castigo' or dias > 180: 
                banda_asignada = "Castigo"
            elif c['estado'] == 'judicial' or (121 <= dias <= 180): 
                banda_asignada = "Judicial"
            elif dias > 30: 
                banda_asignada = "Tardía"
            elif dias > 0: 
                banda_asignada = "Temprana"
            else: 
                banda_asignada = "Preventiva"
                
            # Calcular indicadores consolidados de la cartera (Mora calibrada real) [cite: 30, 33]
            if dias > 0 or c['estado'] in ['judicial', 'castigo']:
                kpis["total_cartera_mora"] += monto
                kpis["clientes_en_riesgo"] += 1
                
            bandas[banda_asignada].append(dict(c))
            
        return {
            "kpis": {
                "total_cartera_mora": f"S/ {kpis['total_cartera_mora']:.2f}",
                "clientes_en_riesgo": kpis["clientes_en_riesgo"]
            },
            "bandas": bandas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def registrar_gestion_cobranza(conn: Connection, body: GestionCobranzaCreate, ejecutor: str):
    try:
        query = text("""
            INSERT INTO gestiones_cobranza (credito_id, tipo_gestion, detalle, fecha_compromiso_pago, monto_comprometido, ejecutado_por) 
            VALUES (:id, 'Gestión del Gestor', :comentario, :fecha, :compromiso, :ejecutor);
        """)
        conn.execute(query, {
            "id": body.credito_id, "comentario": body.comentario, 
            "fecha": body.fecha_compromiso, "compromiso": 1.0 if body.compromiso_pago else 0.0,
            "ejecutor": ejecutor
        })
        conn.commit()
        return {"status": "Éxito", "mensaje": "Historial de acciones de cobranza actualizado (R2)."} [cite: 30]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def ejecutar_transicion_estado_critico(conn: Connection, body: TransicionMoraRequest, rol_usuario: str):
    query_c = text("SELECT dias_atraso FROM creditos WHERE id = :id;")
    credito = conn.execute(query_c, {"id": body.credito_id}).mappings().first()
    
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado.")
        
    # ⚖️ Validación estricta de umbrales normativos de tiempo y jerarquías (R3) [cite: 30]
    if body.nuevo_estado == 'judicial':
        if rol_usuario not in ['Jefe Regional', 'Riesgos', 'Comité de Gerencia']:
            raise HTTPException(status_code=403, detail="Acceso denegado: Rol sin jerarquía para derivación judicial.") [cite: 25]
        if credito['dias_atraso'] < 121:
            raise HTTPException(status_code=400, detail=f"Normativa interna: Mínimo 121 días de mora requeridos (Tiene {credito['dias_atraso']}).") [cite: 30]
            
    elif body.nuevo_estado == 'castigo':
        if rol_usuario not in ['Comité de Gerencia']:
            raise HTTPException(status_code=403, detail="Acceso denegado: Operación reservada exclusivamente para el Comité de Gerencia.") [cite: 25]
        if credito['dias_atraso'] <= 180:
            raise HTTPException(status_code=400, detail=f"Normativa interna: Mínimo más de 180 días de mora requeridos para Castigo.") [cite: 30]

    # Ejecutar la transición autorizada en la base de datos
    conn.execute(text("UPDATE creditos SET estado = :estado WHERE id = :id;"), {"estado": body.nuevo_estado, "id": body.credito_id})
    conn.commit()
    return {"status": "Éxito", "mensaje": f"Crédito #{body.credito_id} migrado exitosamente a la banda de '{body.nuevo_estado}'."}