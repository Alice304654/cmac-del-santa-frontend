from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

# =========================
# 🔐 HASH DE CONTRASEÑAS
# =========================
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# =========================
# 🔑 CONFIG JWT
# =========================
SECRET_KEY = "TU_CLAVE_SECRETA_CAMBIALA"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# =========================
# 🔒 PASSWORD HASH
# =========================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verificar_password(password_plain: str, password_hash: str) -> bool:
    return pwd_context.verify(password_plain, password_hash)


# =========================
# 🎟 CREAR TOKEN JWT
# =========================
def crear_access_token(data: dict, expires_delta: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})

    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return token