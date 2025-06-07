from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import asyncpg
import os
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

from models import (
    WalletAuthRequest, WalletAuthChallenge, WalletAuthVerify, 
    AuthToken, User, UserCreate
)
from services.auth import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Database connection
async def get_db_connection():
    return await asyncpg.connect(os.environ.get("DATABASE_URL"))

@router.post("/challenge", response_model=WalletAuthChallenge)
async def request_auth_challenge(request: WalletAuthRequest):
    """Generate authentication challenge for wallet"""
    if not auth_service.validate_xrp_address(request.wallet_address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid XRP wallet address"
        )
    
    challenge = auth_service.generate_challenge(request.wallet_address)
    
    return WalletAuthChallenge(
        challenge=challenge,
        wallet_address=request.wallet_address
    )

@router.post("/verify", response_model=AuthToken)
async def verify_wallet_signature(request: WalletAuthVerify):
    """Verify wallet signature and return JWT token"""
    
    # Verify the signature
    if not auth_service.verify_signature(
        request.wallet_address, 
        request.signature, 
        request.challenge,
        request.xaman_payload_uuid,
        request.xumm_sdk_auth
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature or expired challenge"
        )
    
    # Get or create user
    conn = await get_db_connection()
    try:
        # Check if user exists
        user_row = await conn.fetchrow(
            "SELECT id, wallet_address, created_at FROM users WHERE wallet_address = $1",
            request.wallet_address
        )
        
        if user_row:
            # Update last login
            await conn.execute(
                "UPDATE users SET last_login = $1 WHERE id = $2",
                datetime.utcnow(), user_row['id']
            )
            user_id = str(user_row['id'])
        else:
            # Create new user
            user_id = str(uuid4())
            await conn.execute(
                """INSERT INTO users (id, wallet_address, created_at, last_login) 
                   VALUES ($1, $2, $3, $4)""",
                UUID(user_id), request.wallet_address, datetime.utcnow(), datetime.utcnow()
            )
        
        # Create and return JWT token
        token_data = auth_service.create_access_token(
            wallet_address=request.wallet_address,
            user_id=user_id
        )
        
        return AuthToken(**token_data)
        
    finally:
        await conn.close()

@router.get("/me", response_model=User)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user information"""
    token_data = auth_service.verify_token(credentials.credentials)
    
    conn = await get_db_connection()
    try:
        user_row = await conn.fetchrow(
            "SELECT id, wallet_address, created_at, last_login FROM users WHERE id = $1",
            UUID(token_data["user_id"])
        )
        
        if not user_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return User(
            id=user_row['id'],
            wallet_address=user_row['wallet_address'],
            created_at=user_row['created_at'],
            last_login=user_row['last_login']
        )
        
    finally:
        await conn.close()

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user (token invalidation would be handled client-side)"""
    # In a production system, you might want to maintain a blacklist of tokens
    # For now, we'll just validate the token and return success
    auth_service.verify_token(credentials.credentials)
    return {"message": "Successfully logged out"}

# Dependency for protected routes
async def get_current_user_dep(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to get current user for protected routes"""
    return auth_service.verify_token(credentials.credentials) 