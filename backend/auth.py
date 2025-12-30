# backend/auth.py
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os
import secrets

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Password Hashing
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

# JWT Token Functions
def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Password Reset Token
def create_reset_token(email: str) -> str:
    """Create password reset token (valid for 1 hour)"""
    expire = datetime.utcnow() + timedelta(hours=1)
    data = {"email": email, "exp": expire, "type": "reset"}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_reset_token(token: str) -> str:
    """Verify password reset token and return email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            return None
        return payload.get("email")
    except JWTError:
        return None

# Dependency for protected routes
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(lambda: next(get_db_dependency()))
):
    """Get current authenticated user"""
    from database import UserDB
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = UserDB.get_user_by_id(db, user_id)
    
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# Helper for dependency injection
def get_db_dependency():
    """Get database session for dependency injection"""
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Email sending (placeholder - integrate with SendGrid/Azure Communication Services)
async def send_password_reset_email(email: str, reset_token: str):
    """Send password reset email"""
    # TODO: Integrate with Azure Communication Services or SendGrid
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
    
    print(f"""
    ✉️ PASSWORD RESET EMAIL
    To: {email}
    Reset Link: {reset_link}
    
    (In production, this will be sent via Azure Communication Services)
    """)
    
    return True
