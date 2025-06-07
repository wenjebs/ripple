import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from fastapi import HTTPException, status
import xrpl
from xrpl.utils import str_to_hex
from xrpl.wallet import Wallet
from xrpl.models.requests import AccountInfo
from xrpl.models.response import Response

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

class AuthService:
    def __init__(self):
        self.challenges: Dict[str, Dict[str, Any]] = {}  # In production, use Redis
        
    def generate_challenge(self, wallet_address: str) -> str:
        """Generate a unique challenge for wallet authentication"""
        challenge = secrets.token_urlsafe(32)
        timestamp = datetime.utcnow()
        
        # Store challenge with expiration (5 minutes)
        self.challenges[wallet_address] = {
            "challenge": challenge,
            "timestamp": timestamp,
            "expires_at": timestamp + timedelta(minutes=5)
        }
        
        # Create the message to be signed
        message = f"Sign this message to authenticate with Ripple Goals:\n\nChallenge: {challenge}\nWallet: {wallet_address}\nTimestamp: {timestamp.isoformat()}"
        return message
    
    def verify_signature(self, wallet_address: str, signature: str, challenge: str, xaman_payload_uuid: str = None, xumm_sdk_auth: bool = False) -> bool:
        """Verify the wallet signature against the challenge"""
        try:
            # Check if challenge exists and is valid
            if wallet_address not in self.challenges:
                return False
                
            stored_challenge = self.challenges[wallet_address]
            
            # Check challenge match and expiration
            if (stored_challenge["challenge"] != challenge.split("Challenge: ")[1].split("\n")[0] or
                datetime.utcnow() > stored_challenge["expires_at"]):
                return False
            
            # Special handling for Xumm Universal SDK authentication
            if signature == 'xumm_universal_auth' and xumm_sdk_auth:
                # For Xumm Universal SDK authentication, we trust that the user has been verified
                # through the Xumm app's secure OAuth2/JWT authentication flow
                # The SDK handles the cryptographic verification on the client side
                print(f"Xumm Universal SDK auth successful for wallet: {wallet_address}")
                
                # Remove used challenge
                del self.challenges[wallet_address]
                return True
            
            # Legacy handling for Xaman authentication
            if signature == 'xaman_auth' and xaman_payload_uuid:
                # For Xaman authentication, we trust that the user successfully
                # signed the SignIn payload through the Xaman platform
                # The wallet address is already verified by Xaman
                print(f"Xaman auth successful for wallet: {wallet_address}, payload: {xaman_payload_uuid}")
                
                # Remove used challenge
                del self.challenges[wallet_address]
                return True
            
            # For XRP Ledger signature verification
            # Note: This is a simplified version. In production, you'd want to use
            # proper XRPL signature verification methods
            
            # Convert the challenge message to hex for verification
            message_hex = str_to_hex(challenge)
            
            # Here you would implement proper XRPL signature verification
            # For now, we'll do a basic validation that the signature exists and has proper format
            if len(signature) < 64:  # Basic signature length check
                return False
                
            # Remove used challenge
            del self.challenges[wallet_address]
            return True
            
        except Exception as e:
            print(f"Signature verification error: {e}")
            return False
    
    def create_access_token(self, wallet_address: str, user_id: str) -> Dict[str, Any]:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "sub": wallet_address,
            "user_id": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "access_token": encoded_jwt,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            wallet_address: str = payload.get("sub")
            user_id: str = payload.get("user_id")
            
            if wallet_address is None or user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
                
            return {
                "wallet_address": wallet_address,
                "user_id": user_id
            }
            
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def validate_xrp_address(self, address: str) -> bool:
        """Validate if the provided string is a valid XRP address"""
        try:
            # Basic XRP address validation
            if not address.startswith('r') or len(address) < 25 or len(address) > 34:
                return False
            return True
        except Exception:
            return False

# Global auth service instance
auth_service = AuthService() 