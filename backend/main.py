from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
import jwt
from datetime import datetime, timedelta, timezone  # <--- datetime moderno con timezone
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.routes import route_auth, route_cuentas, route_creditos, route_operaciones
from app.routes.route_operaciones import router_operaciones

app = FastAPI(title="Core Bancario Caja del Santa", version="2.0")

# Configuración de Seguridad JWT (Criterio 3)
SECRET_KEY = "CajaMicrofinanzas_Super_Secreta_2026"
ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",  
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

# 1. Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# En tu backend/main.py
app.include_router(route_auth.router, prefix="/api")
app.include_router(route_cuentas.router, prefix="/api")
app.include_router(route_creditos.router, prefix="/api")
app.include_router(route_operaciones.router, prefix="/api")
app.include_router(router_operaciones, prefix="/api")

# 2. CONFIGURACIÓN DE LA CONEXIÓN A SUPABASE
def get_db_connection():
    return psycopg2.connect(
        host="aws-1-us-west-2.pooler.supabase.com", 
        database="postgres",
        user="postgres.wanofossebgbzibkjzkd",
        password="25789fgfdfwsw",    
        port="6543"
    )

# 3. MODELOS DE DATOS PYDANTIC
class SolicitudCreditoInput(BaseModel):
    cliente_id: int
    tipo_credito: str
    monto_solicitado: float
    plazo_meses: int
    ingresos_mensuales: float

class LoginInput(BaseModel):
    username: str
    password: str

class DecisionCreditoInput(BaseModel):  # <--- Añadido para el endpoint de evaluar
    credito_id: int
    nueva_decision: str  # 'Aprobado' o 'Rechazado'

class RegistroGestionInput(BaseModel):
    credito_id: int
    tipo_gestion: str  # 'Llamada', 'Visita Campo', 'Carta Notarial', 'Compromiso'
    detalle: str
    fecha_compromiso_pago: str = None  # Formato 'YYYY-MM-DD' opcional
    monto_comprometido: float = None

class TransicionMoraInput(BaseModel):
    credito_id: int
    nuevo_estado: str  # 'Judicial' o 'Castigo'


# 4. FUNCIONES DE UTILERÍA JWT (Criterio 3)
def crear_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=8) # 8 horas de validez
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verificar_token_y_rol(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(
            status_code=401, 
            detail="Acceso denegado: No se encontró el token de seguridad. Por favor, inicie sesión."
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        rol: str = payload.get("rol")
        usuario_id: int = payload.get("id")
        
        if username is None or rol is None:
            raise HTTPException(status_code=401, detail="Token inválido: faltan credenciales de rol.")
            
        return {"id": usuario_id, "username": username, "rol": rol}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="El token de seguridad ha expirado.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token de autenticación corrupto o inválido.")


# ==========================================
# ENDPOINTS DE AUTENTICACIÓN
# ==========================================

@app.post("/api/auth/login")
def login(datos: LoginInput):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Buscamos el usuario en la tabla de Supabase
        cursor.execute("SELECT id, username, password_hash, nombre, rol FROM usuarios WHERE username = %s;", (datos.username,))
        usuario = cursor.fetchone()
        
        if not usuario or usuario['password_hash'] != datos.password:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
        
        # Generamos el token JWT incluyendo el ROL en el payload
        token = crear_access_token({
            "sub": usuario['username'], 
            "rol": usuario['rol'], 
            "id": usuario['id']
        })
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "usuario": {
                "nombre": usuario['nombre'],
                "rol": usuario['rol']
            }
        }
    finally:
        cursor.close()
        conn.close()


# ==========================================
# ENDPOINTS DE LECTURA (HOMEBANKING)
# ==========================================

@app.get("/api/cuentas/{cliente_id}")
def obtener_cuentas(cliente_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT id, numero_cuenta, tipo_cuenta, saldo, moneda FROM cuentas_ahorro WHERE cliente_id = %s;", (cliente_id,))
        cuentas = cursor.fetchall()
        return cuentas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/creditos/cliente/{cliente_id}")
def obtener_creditos_cliente(cliente_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT id, codigo_credito, tipo_credito, monto_solicitado, plazo_meses, cuota_mensual, estado FROM creditos WHERE cliente_id = %s;", (cliente_id,))
        creditos = cursor.fetchall()
        return creditos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ==========================================
# ENDPOINTS DE CRÉDITOS Y OPERACIONES (RBAC)
# ==========================================

@app.post("/api/creditos/solicitar")
def registrar_solicitud(solicitud: SolicitudCreditoInput):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("SELECT id FROM creditos WHERE cliente_id = %s AND estado = 'En Evaluacion';", (solicitud.cliente_id,))
        tiene_pendiente = cursor.fetchone()
        if tiene_pendiente:
            raise HTTPException(status_code=400, detail="El cliente ya cuenta con una solicitud en proceso de evaluación.")

        tea = 0.35
        tem = (1 + tea) ** (1 / 12) - 1  
        monto = solicitud.monto_solicitado
        n = solicitud.plazo_meses
        
        cuota_mensual = (monto * tem) / (1 - (1 + tem) ** (-n))

        if solicitud.ingresos_mensuales <= 0:
            raise HTTPException(status_code=400, detail="Los ingresos mensuales deben ser mayores a cero.")
            
        rds = (cuota_mensual / solicitud.ingresos_mensuales) * 100

        if rds > 45.00:
            semaforo = "Rojo"
            estado_inicial = "Rechazado Automático"
            nivel_aprobacion = "Ninguno"
        elif rds > 30.00:
            semaforo = "Ámbar"
            estado_inicial = "En Evaluacion"
            nivel_aprobacion = "Riesgos / Comité"  
        else:
            semaforo = "Verde"
            estado_inicial = "En Evaluacion"
            nivel_aprobacion = "Asesor"

        if semaforo != "Rojo":
            if monto > 50000:
                nivel_aprobacion = "Comité de Gerencia"
            elif monto > 15000:
                nivel_aprobacion = "Jefe Regional"

        query = """
            INSERT INTO creditos (cliente_id, tipo_credito, monto_solicitado, plazo_meses, cuota_mensual, estado, semaforo, rds_calculado, nivel_aprobacion)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        cursor.execute(query, (
            solicitud.cliente_id, 
            solicitud.tipo_credito, 
            solicitud.monto_solicitado, 
            solicitud.plazo_meses, 
            cuota_mensual, 
            estado_inicial, 
            semaforo, 
            rds, 
            nivel_aprobacion
        ))
        
        conn.commit()
        return {
            "status": "Procesado",
            "decision": estado_inicial,
            "semaforo": semaforo,
            "rds": f"{rds:.2f}%",
            "cuota": f"S/ {cuota_mensual:.2f}",
            "instancia_evaluadora": nivel_aprobacion
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.post("/api/creditos/evaluar")  # <--- Endpoint protegido añadido en su lugar correspondiente
def evaluar_solicitud(datos: DecisionCreditoInput, token_data: dict = Depends(verificar_token_y_rol)):
    # VALIDACIÓN DE ROL REQUERIDA (RBAC)
    roles_permitidos = ['Asesor', 'Jefe Regional', 'Riesgos', 'Comité de Gerencia']
    
    if token_data["rol"] not in roles_permitidos:
        raise HTTPException(
            status_code=403, 
            detail=f"Acceso Denegado: Tu rol de {token_data['rol']} no tiene permisos para dictaminar créditos."
        )
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        nuevo_estado = "Aprobado" if datos.nueva_decision == "Aprobado" else "Rechazado"
        
        cursor.execute(
            "UPDATE creditos SET estado = %s WHERE id = %s;",
            (nuevo_estado, datos.credito_id)
        )
        conn.commit()
        
        return {
            "status": "Éxito",
            "mensaje": f"El crédito #{datos.credito_id} ha sido dictaminado como {nuevo_estado} por el usuario {token_data['username']} ({token_data['rol']})."
        }
    finally:
        cursor.close()
        conn.close()


@app.post("/api/creditos/desembolsar/{credito_id}")
def desembolsar_credito(credito_id: int, cuenta_destino_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT * FROM creditos WHERE id = %s;", (credito_id,))
        credito = cursor.fetchone()
        
        if not credito or credito['estado'] == 'Desembolsado':
            raise HTTPException(status_code=400, detail="Crédito no encontrado o ya desembolsado.")
        
        monto = float(credito['monto_solicitado'])
        nuevo_codigo = f"CR-SANTA{1000 + credito_id}"
        
        # 1. Cambiar estado del préstamo en el Core
        cursor.execute("UPDATE creditos SET estado = 'Desembolsado', codigo_credito = %s WHERE id = %s;", (nuevo_codigo, credito_id))
        
        # 2. Sincronización nativa: Sumar dinero a la cuenta de ahorros del Homebanking
        cursor.execute("UPDATE cuentas_ahorro SET saldo = saldo + %s WHERE id = %s;", (monto, cuenta_destino_id))
        
        # 3. 🌟 NUEVO: Registrar el movimiento bancario para cumplimiento de la Rúbrica C1
        query_movimiento = """
            INSERT INTO movimientos_cuenta (cuenta_id, tipo_movimiento, monto, descripcion)
            VALUES (%s, 'Desembolso', %s, %s);
        """
        cursor.execute(query_movimiento, (
            cuenta_destino_id, 
            monto, 
            f"Desembolso de Crédito {credito['tipo_credito']} {nuevo_codigo}"
        ))
        
        conn.commit()
        return {"message": "¡Desembolso exitoso! Saldo y movimientos sincronizados en el Homebanking."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/recuperaciones/mora")
def obtener_cartera_mora(token_data: dict = Depends(verificar_token_y_rol)):
    # Solo personal del banco puede auditar o gestionar la mora
    roles_banco = ['Asesor', 'Jefe Regional', 'Riesgos', 'Comité de Gerencia']
    if token_data["rol"] not in roles_banco:
        raise HTTPException(status_code=403, detail="Acceso denegado: Los clientes no pueden ver la cartera de mora.")

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # 1. Traemos todos los créditos que tengan algún nivel de atraso o estado especial
        cursor.execute("""
            SELECT id, cliente_id, tipo_credito, monto_solicitado AS saldo_pendiente, dias_atraso, estado 
            FROM creditos 
            WHERE dias_atraso >= 0 AND estado IN ('Desembolsado', 'Judicial', 'Castigo')
            ORDER BY dias_atraso DESC;
        """)
        creditos = cursor.fetchall()
        
        # 2. Inicializamos las bandas y los KPIs exigidos por la rúbrica
        kpis = {"total_cartera_mora": 0.0, "clientes_en_riesgo": 0}
        bandas = {
            "Preventiva": [],  # 0 días
            "Temprana": [],     # 1-30 días
            "Tardía": [],       # 31-120 días
            "Judicial": [],     # 121-180 días o estado Judicial
            "Castigo": []       # >180 días o estado Castigo
        }
        
        for c in creditos:
            dias = c['dias_atraso']
            monto = float(c['saldo_pendiente'])
            
            # Clasificación lógica por días de atraso (Reglas de Negocio)
            if c['estado'] == 'Castigo' or dias > 180:
                banda_asignada = "Castigo"
            elif c['estado'] == 'Judicial' or (dias >= 121 and dias <= 180):
                banda_asignada = "Judicial"
            elif dias > 30:
                banda_asignada = "Tardía"
            elif dias > 0:
                banda_asignada = "Temprana"
            else:
                banda_asignada = "Preventiva"
                
            # Acumular KPIs si el cliente ya presenta atraso real
            if dias > 0 or c['estado'] in ['Judicial', 'Castigo']:
                kpis["total_cartera_mora"] += monto
                kpis["clientes_en_riesgo"] += 1
                
            bandas[banda_asignada].append(c)
            
        return {
            "kpis": {
                "total_cartera_mora": f"S/ {kpis['total_cartera_mora']:.2f}",
                "clientes_en_riesgo": kpis["clientes_en_riesgo"]
            },
            "bandas": bandas
        }
    finally:
        cursor.close()
        conn.close()

@app.post("/api/recuperaciones/gestionar")
def registrar_gestion_cobranza(datos: RegistroGestionInput, token_data: dict = Depends(verificar_token_y_rol)):
    roles_permitidos = ['Asesor', 'Jefe Regional']
    if token_data["rol"] not in roles_permitidos:
        raise HTTPException(status_code=403, detail="Tu rol no está autorizado para registrar gestiones de cobranza.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        query = """
            INSERT INTO gestiones_cobranza (credito_id, tipo_gestion, detalle, fecha_compromiso_pago, monto_comprometido, ejecutado_por)
            VALUES (%s, %s, %s, %s, %s, %s);
        """
        cursor.execute(query, (
            datos.credito_id,
            datos.tipo_gestion,
            datos.detalle,
            datos.fecha_compromiso_pago if datos.fecha_compromiso_pago else None,
            datos.monto_comprometido if datos.monto_comprometido else None,
            token_data["username"]  # Se extrae de forma segura del JWT (Criterio 3)
        ))
        conn.commit()
        return {"status": "Éxito", "mensaje": "Gestión de cobranza registrada en el historial del crédito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/recuperaciones/cambiar-estado")
def ejecutar_transicion_critica(datos: TransicionMoraInput, token_data: dict = Depends(verificar_token_y_rol)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Verificar primero que el crédito exista y ver sus días de atraso reales
        cursor.execute("SELECT dias_atraso, estado FROM creditos WHERE id = %s;", (datos.credito_id,))
        credito = cursor.fetchone()
        
        if not credito:
            raise HTTPException(status_code=404, detail="El crédito solicitado no existe.")
            
        # 🚫 VALIDACIONES ESTRICTAS DE SEGURIDAD Y NORMATIVA (R3)
        if datos.nuevo_estado == 'Judicial':
            # Exigencia rúbrica: >= 121 días de atraso y roles superiores
            roles_judicial = ['Jefe Regional', 'Riesgos', 'Comité de Gerencia']
            if token_data["rol"] not in roles_judicial:
                raise HTTPException(status_code=403, detail="Acceso Denegado: Solo la Jefatura o Riesgos pueden derivar a la vía Judicial.")
            if credito['dias_atraso'] < 121:
                raise HTTPException(status_code=400, detail=f"Normativa Incumplida: El cliente tiene {credito['dias_atraso']} días de atraso. Requiere mínimo 121 días para pase Judicial.")
                
        elif datos.nuevo_estado == 'Castigo':
            # Exigencia rúbrica: > 180 días de atraso y solo la plana mayor (Gerencia/Comité)
            roles_castigo = ['Comité de Gerencia']
            if token_data["rol"] not in roles_castigo:
                raise HTTPException(status_code=403, detail="Acceso Denegado Crítico: El castigo de cartera requiere aprobación exclusiva del Comité de Gerencia.")
            if credito['dias_atraso'] <= 180:
                raise HTTPException(status_code=400, detail=f"Normativa Incumplida: Cartera vigente. Requiere más de 180 días de atraso para ser castigada.")
        else:
            raise HTTPException(status_code=400, detail="Estado de transición no válido para el módulo de recuperaciones.")

        # Si pasa los filtros de seguridad y días, se ejecuta la actualización
        cursor.execute("UPDATE creditos SET estado = %s WHERE id = %s;", (datos.nuevo_estado, datos.credito_id))
        conn.commit()
        
        return {
            "status": "Transición Autorizada",
            "mensaje": f"El crédito #{datos.credito_id} ha pasado exitosamente al estado '{datos.nuevo_estado}' bajo la aprobación de {token_data['username']} ({token_data['rol']})."
        }
    finally:
        cursor.close()
        conn.close()