# Web3 XRP Wallet Authentication Setup Guide

## Overview
This guide will help you set up Web3 XRP wallet authentication for the Ripple Goals application.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ripple_goals

# Supabase (existing)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# JWT Authentication
JWT_SECRET_KEY=your_super_secret_jwt_key_here_make_it_long_and_random

# Optional: XRP Ledger Configuration
XRPL_NETWORK=mainnet  # or testnet for development
```

### 3. Database Migration
The application will automatically create the required tables on startup, including the new `users` table.

### 4. Start Backend
```bash
cd backend
uvicorn main:app --reload
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the `frontend/` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# XUMM Configuration (Optional - for production wallet integration)
NEXT_PUBLIC_XUMM_API_KEY=your_xumm_api_key_here
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

## XUMM Integration (Optional)

### 1. Get XUMM API Key
1. Visit [XUMM Developer Console](https://apps.xumm.dev/)
2. Create a new application
3. Get your API key and secret
4. Add the API key to your frontend environment variables

### 2. Configure XUMM
- Set up your app's return URLs
- Configure webhook endpoints if needed
- Test with XUMM testnet first

## Authentication Flow

### 1. Challenge-Response Authentication
1. User connects wallet (XUMM or manual entry)
2. Backend generates a unique challenge message
3. User signs the challenge with their wallet
4. Backend verifies the signature
5. JWT token is issued for authenticated sessions

### 2. Wallet Connection Options
- **XUMM Wallet**: Full integration with XUMM mobile app
- **Manual Entry**: For development and testing
- **Demo Mode**: Simulated authentication for testing

## Security Features

### 1. Message Signing
- Unique challenge per authentication attempt
- Time-limited challenges (5 minutes)
- Cryptographic signature verification

### 2. JWT Tokens
- 7-day expiration
- Secure token storage
- Automatic token validation

### 3. User Management
- Automatic user creation on first login
- Wallet address as unique identifier
- Login tracking and session management

## API Endpoints

### Authentication Endpoints
- `POST /auth/challenge` - Request authentication challenge
- `POST /auth/verify` - Verify wallet signature
- `GET /auth/me` - Get current user information
- `POST /auth/logout` - Logout user

### Protected Endpoints
All existing endpoints now require authentication:
- Goals: `/goals/*`
- Tasks: `/tasks/*`
- Submissions: `/submissions/*`

## Development Notes

### 1. Demo Mode
For development, you can use the demo login which simulates wallet authentication without requiring actual wallet signatures.

### 2. Signature Verification
The current implementation includes basic signature validation. For production, implement proper XRPL signature verification using the `xrpl-py` library.

### 3. Challenge Storage
Currently using in-memory storage for challenges. For production, use Redis or database storage for scalability.

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

2. **XUMM Connection Failed**
   - Check API key configuration
   - Verify network connectivity
   - Test with XUMM testnet first

3. **JWT Token Invalid**
   - Check JWT_SECRET_KEY configuration
   - Verify token expiration
   - Clear browser storage and re-authenticate

### Testing

1. **Backend API Testing**
   ```bash
   # Test challenge generation
   curl -X POST http://localhost:8000/auth/challenge \
     -H "Content-Type: application/json" \
     -d '{"wallet_address": "rTestWalletAddress123"}'
   ```

2. **Frontend Testing**
   - Use demo mode for quick testing
   - Test wallet connection flow
   - Verify authentication persistence

## Production Deployment

### 1. Security Checklist
- [ ] Use strong JWT secret key
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Use production database
- [ ] Set up proper logging
- [ ] Configure rate limiting

### 2. Environment Variables
- Set all production environment variables
- Use secure secret management
- Configure production XUMM app

### 3. Database
- Run database migrations
- Set up database backups
- Configure connection pooling

## Next Steps

1. **Enhanced Wallet Support**
   - Add support for more XRP wallets
   - Implement hardware wallet support
   - Add wallet connection persistence

2. **Advanced Security**
   - Implement proper XRPL signature verification
   - Add rate limiting for authentication
   - Set up audit logging

3. **User Experience**
   - Add wallet connection status indicators
   - Implement automatic token refresh
   - Add wallet switching functionality 