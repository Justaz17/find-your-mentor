from jose import jwt
from datetime import datetime, timedelta, timezone
from app.schemas.user import UserCreate, UserOut, UserLogin, Token
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import db
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.db.database import get_db
from passlib.context import CryptContext
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS
from app.core.security import get_current_user

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile and return updated token"""
    # Create new token with current user data (in case role changed)
    token_data = {
        "sub": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "user_id": current_user.id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "user": current_user,
        "access_token": access_token,
    }


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    password_hash = pwd_context.hash(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=password_hash,
        role=user_data.role or "learner",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and receive JWT token"""

    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    if not pwd_context.verify(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    token_data = {
        "sub": user.email,
        "name": user.name,
        "role": user.role,
        "user_id": user.id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": access_token, "token_type": "bearer"}
