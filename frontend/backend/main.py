from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Caja del Santa - API Backend",
    description="Servidor de autenticación para Home Banking",
    version="1.0.0"
)

# ==========================================
# 1. CONFIGURACIÓN COMPLETA DE CORS
# ==========================================
# Agregamos los puertos locales comunes de Vite (5173 y 5174)
origins = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Autoriza a tu app React a comunicarse
    allow_credentials=True,
    allow_methods=["*"],    # Permite POST, GET, OPTIONS, etc.
    allow_headers=["*"],    # Permite Content-Type, Authorization, etc.
)


# ==========================================
# 2. MODELO DE DATOS (Para la opción JSON de React)
# ==========================================
# Este modelo procesa el JSON enviado por la 'OPCIÓN A' de tu formulario React
class LoginRequest(BaseModel):
    username: str  # Aquí se recibirá el DNI enviado desde el frontend
    password: str


# ==========================================
# 3. RUTA DE LOGIN (/auth/login)
# ==========================================
@app.post("/auth/login", status_code=status.HTTP_200_OK)
async def login(payload: LoginRequest):
    # Aquí puedes ver en la consola de Python qué datos están llegando
    print(f"Intento de login recibido para el DNI: {payload.username}")
    
    # --- EJEMPLO DE VALIDACIÓN DE CREDENCIALES ---
    # Reemplaza esta lógica simulada con tu consulta real a la Base de Datos
    DNI_DE_PRUEBA = "60105521"
    CLAVE_DE_PRUEBA = "123456" # Cambia esto por la contraseña que uses para testear
    
    if payload.username == DNI_DE_PRUEBA and payload.password == CLAVE_DE_PRUEBA:
        # Si las credenciales son correctas, respondemos con el token esperado por tu React
        return {
            "access_token": "token_secreto_generado_por_el_backend_xyz123",
            "token_type": "bearer"
        }
    
    # Si las credenciales fallan, arrojamos un error 401
    # El texto de 'detail' es el que tu React atrapará y mostrará en la tarjeta roja
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="La clave de internet o el número de DNI son incorrectos. Inténtelo de nuevo."
    )

# Ruta base de prueba para verificar que el servidor responda en el navegador
@app.get("/")
def read_root():
    return {"status": "Backend de Caja del Santa corriendo correctamente"}