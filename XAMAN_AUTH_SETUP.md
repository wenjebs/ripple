# Xaman QR Code Authentication Setup

This guide explains how to set up and use the Xaman QR code authentication system in your Ripple Goals application.

## Overview

The authentication system uses Xaman's SignIn payloads to provide secure wallet-based authentication through QR codes. Users scan a QR code with their Xaman app, approve the sign-in request, and are automatically authenticated.

## Prerequisites

1. **Xaman Developer Account**: Sign up at [Xaman Developer Console](https://apps.xumm.dev/)
2. **API Credentials**: Get your API Key and API Secret from the developer console
3. **Xaman Mobile App**: Users need the Xaman app installed on their mobile device

## Environment Setup

Add the following environment variables to your `.env.local` file:

```bash
# Xaman API Credentials
NEXT_PUBLIC_XUMM_API_KEY=your_api_key_here
NEXT_PUBLIC_XUMM_API_SECRET=your_api_secret_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key Features

### 1. QR Code Generation
- Creates unique SignIn payloads for each authentication attempt
- Displays QR code that users scan with Xaman app
- Provides deep link for direct app opening

### 2. Real-time Status Updates
- Polls Xaman API for authentication status
- Shows loading states and user feedback
- Handles timeouts and cancellations

### 3. Secure Backend Verification
- Validates wallet addresses received from Xaman
- Creates user accounts automatically
- Issues JWT tokens for session management

## How It Works

### Frontend Flow (useAuth.tsx)

1. **Payload Creation**: Creates a SignIn payload using Xaman SDK
```typescript
const payload = await xumm.payload.create({
  txjson: {
    TransactionType: 'SignIn'
  },
  options: {
    submit: false,
    return_url: {
      app: `${window.location.origin}/auth/callback`,
      web: `${window.location.origin}/auth/callback`
    }
  }
})
```

2. **QR Code Display**: Shows the QR code and deep link
3. **Status Polling**: Continuously checks for user approval
4. **Backend Verification**: Sends wallet address to backend for verification

### Backend Flow (auth.py)

1. **Challenge Generation**: Creates unique challenge for the wallet
2. **Xaman Verification**: Accepts special 'xaman_auth' signature for Xaman-verified requests
3. **User Management**: Creates or retrieves user account
4. **JWT Token**: Issues access token for authenticated sessions

## Components

### XamanLogin Component
A complete authentication UI component that handles:
- Login button with loading states
- QR code display during authentication
- Success state with user info
- Error handling and cancellation

### AuthProvider Hook
Provides authentication context with:
- `login()`: Initiates Xaman authentication
- `logout()`: Clears authentication
- `cancelAuth()`: Cancels pending authentication
- Authentication state management

## Testing the Implementation

1. **Start the backend**: Ensure your FastAPI backend is running on port 8000
2. **Start the frontend**: Run your Next.js app
3. **Visit the demo**: Go to `/auth-demo` to test the authentication
4. **Use Xaman app**: Scan the QR code with your Xaman mobile app

## Security Considerations

### 1. API Key Security
- Never expose API secrets in frontend code
- Use environment variables for configuration
- Consider using backend-only authentication for production

### 2. Challenge Validation
- Challenges expire after 5 minutes
- Each challenge can only be used once
- Wallet addresses are validated against Xaman responses

### 3. JWT Token Management
- Tokens expire after 7 days
- Stored securely in localStorage
- Validated on each protected request

## Production Deployment

### 1. Environment Variables
Set production environment variables:
```bash
NEXT_PUBLIC_XUMM_API_KEY=your_production_api_key
NEXT_PUBLIC_XUMM_API_SECRET=your_production_api_secret
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### 2. CORS Configuration
Ensure your backend allows requests from your frontend domain.

### 3. SSL/TLS
Use HTTPS for all communications in production.

## Troubleshooting

### Common Issues

1. **"XUMM SDK not initialized"**
   - Check API credentials in environment variables
   - Verify API key format and permissions

2. **QR Code not displaying**
   - Check network connectivity
   - Verify API credentials are valid
   - Check browser console for errors

3. **Authentication timeout**
   - Ensure Xaman app is installed and working
   - Check if user approved the request in time
   - Verify backend is accessible

4. **Backend verification failed**
   - Check backend logs for detailed errors
   - Verify database connectivity
   - Ensure JWT secret is configured

## Development Tips

1. **Testing with Xaman Testnet**: Use testnet credentials for development
2. **Debug Mode**: Enable console logging to track authentication flow
3. **Fallback UI**: Provide clear instructions for users new to Xaman

## Next Steps

1. **Push Notifications**: Implement user tokens for push notifications
2. **Multi-device Support**: Handle authentication across multiple devices
3. **Enhanced Security**: Add additional verification layers for high-value operations

For more information, visit the [Xaman Developer Documentation](https://docs.xaman.dev/). 