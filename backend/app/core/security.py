import base64
import hashlib
import hmac
import os
import re
import secrets
import string
from typing import Final

SESSION_COOKIE_NAME: Final[str] = os.getenv("SESSION_COOKIE_NAME", "red_session")
SESSION_DURATION_HOURS: Final[int] = int(os.getenv("SESSION_DURATION_HOURS", "12"))
SESSION_COOKIE_SECURE: Final[bool] = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
SESSION_COOKIE_SAMESITE: Final[str] = os.getenv("SESSION_COOKIE_SAMESITE", "lax")

PASSWORD_REGEX_UPPER = re.compile(r"[A-Z]")
PASSWORD_REGEX_LOWER = re.compile(r"[a-z]")
PASSWORD_REGEX_DIGIT = re.compile(r"\d")

# Alfabeto sin caracteres ambiguos (0 O 1 l I) para contraseñas temporales dictadas/leídas.
TEMP_PASSWORD_UPPER: Final[str] = "".join(c for c in string.ascii_uppercase if c not in "OI")
TEMP_PASSWORD_LOWER: Final[str] = "".join(c for c in string.ascii_lowercase if c != "l")
TEMP_PASSWORD_DIGITS: Final[str] = "23456789"


def generate_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=2**14,
        r=8,
        p=1,
        dklen=64,
    )
    return (
        f"scrypt$16384$8$1$"
        f"{base64.b64encode(salt).decode('utf-8')}$"
        f"{base64.b64encode(digest).decode('utf-8')}"
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, n, r, p, salt_b64, digest_b64 = stored_hash.split("$", 5)
        if algorithm != "scrypt":
            return False

        salt = base64.b64decode(salt_b64.encode("utf-8"))
        expected = base64.b64decode(digest_b64.encode("utf-8"))

        candidate = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
        )
        return hmac.compare_digest(candidate, expected)
    except Exception:
        return False


def validate_password_policy(password: str) -> None:
    if len(password) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres.")
    if not PASSWORD_REGEX_UPPER.search(password):
        raise ValueError("La contraseña debe contener al menos una mayúscula.")
    if not PASSWORD_REGEX_LOWER.search(password):
        raise ValueError("La contraseña debe contener al menos una minúscula.")
    if not PASSWORD_REGEX_DIGIT.search(password):
        raise ValueError("La contraseña debe contener al menos un número.")


def generate_temporary_password() -> str:
    """Contraseña temporal aleatoria con formato Xxxx-Xxxx-Xxxx (12 caracteres + 2 guiones)."""
    chars = [
        secrets.choice(TEMP_PASSWORD_UPPER),
        secrets.choice(TEMP_PASSWORD_LOWER),
        secrets.choice(TEMP_PASSWORD_DIGITS),
    ]
    alphabet = TEMP_PASSWORD_UPPER + TEMP_PASSWORD_LOWER + TEMP_PASSWORD_DIGITS
    chars += [secrets.choice(alphabet) for _ in range(9)]
    secrets.SystemRandom().shuffle(chars)
    raw = "".join(chars)
    return f"{raw[0:4]}-{raw[4:8]}-{raw[8:12]}"
