from sqlalchemy import create_engine, text
from app.core.cfg_security import hash_password
from app.core.cfg_config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.begin() as conn:

    usuarios = conn.execute(text("""
        SELECT id, username, password_hash, nombre, rol
        FROM usuarios
    """)).mappings().all()

    for u in usuarios:

        cliente = conn.execute(text("""
            SELECT pkcliente
            FROM dcliente
            WHERE codcliente=:codigo
        """), {"codigo": u["username"]}).mappings().first()

        conn.execute(text("""
            INSERT INTO usuarios_homebanking
            (
                pkcliente,
                username,
                password_hash,
                rol,
                activo,
                bloqueado
            )
            VALUES
            (
                :pkcliente,
                :username,
                :password_hash,
                :rol,
                'S',
                'N'
            )
            ON CONFLICT (username) DO NOTHING
        """), {
            "pkcliente": cliente["pkcliente"],
            "username": u["username"],
            "password_hash": hash_password(u["password_hash"]),
            "rol": u["rol"].upper(),
        })

print("Migración completada.")