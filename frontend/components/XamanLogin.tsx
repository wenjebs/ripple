"use client"

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function XamanLogin() {
  const { 
    isAuthenticated, 
    isLoading, 
    isXApp,
    isBrowser,
    account,
    login, 
    logout, 
    user 
  } = useAuth()
  
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    const success = await login()
    
    if (!success) {
      setError('Authentication failed. Please try again.')
    }
  }

  if (isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connected!</h2>
          <p className="text-gray-600">Successfully authenticated with Xaman</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment
            </label>
            <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
              {isXApp && "🔶 xApp Environment"}
              {isBrowser && "🌐 Browser Environment"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Address
            </label>
            <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded break-all">
              {account}
            </div>
          </div>

          {user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                {user.id}
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect with Xaman</h2>
        <p className="text-gray-600">Secure authentication using your XRP wallet</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="text-sm text-gray-500">
          <p>Environment: {isXApp ? "🔶 xApp" : isBrowser ? "🌐 Browser" : "❓ Unknown"}</p>
        </div>

        {isBrowser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Browser Authentication</h3>
            <p className="text-xs text-blue-700">
              You&apos;ll be redirected to Xaman for secure OAuth2 authentication.
            </p>
          </div>
        )}

        {isXApp && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-orange-800 mb-2">xApp Authentication</h3>
            <p className="text-xs text-orange-700">
              You&apos;re already in the Xaman app environment.
            </p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <span>Connect with Xaman</span>
          )}
        </button>

        <div className="text-xs text-gray-500 text-center">
          <p>By connecting, you agree to authenticate using your XRP wallet</p>
        </div>
      </div>
    </div>
  )
} 