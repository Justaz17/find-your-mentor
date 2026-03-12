from jose import jwt
from datetime import datetime, timedelta, timezone
from app.schemas.user import UserCreate, UserOut, UserLogin, Token
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import db
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.db.database import get_db
from hashlib import sha256
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    # checking if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # to upgrade to bcrypt later.
    password_hash = sha256(user_data.password.encode()).hexdigest()
    new_user = User(
        email=user_data.email, name=user_data.name, password_hash=password_hash
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and receive JWT token"""

    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    # Verify password
    password_hash = sha256(credentials.password.encode()).hexdigest()
    if user.password_hash != password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    # Create JWT token
    token_data = {
        "sub": user.email,  # "sub" is JWT standard for subject (user id)
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": access_token, "token_type": "bearer"}
