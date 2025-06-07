"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Wallet, Shield, ChevronRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()

  const handleWalletConnect = async (method: 'xumm' | 'browser') => {
    setIsConnecting(true)
    setError(null)

    try {
      const success = await login()
      
      if (success) {
        router.push('/')
      } else {
        setError('Failed to connect wallet. Please try again.')
      }
    } catch (err) {
      setError('An error occurred while connecting. Please try again.')
      console.error('Login error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // For demo purposes, use a test wallet address
      const success = await login('rDemoWalletAddressForTesting12345')
      
      if (success) {
        router.push('/')
      } else {
        setError('Demo login failed. Please try again.')
      }
    } catch (err) {
      setError('Demo login error. Please try again.')
      console.error('Demo login error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-2 bg-white transform rotate-45 translate-y-0.5"></div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-neutral-100 mb-2">
            Welcome to Ripple Goals
          </h1>
          <p className="text-neutral-400">
            Connect your XRP wallet to start achieving your goals
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Wallet Connection Options */}
        <div className="space-y-4">
          {/* XUMM Wallet */}
          <button
            onClick={() => handleWalletConnect('xumm')}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-neutral-700 disabled:to-neutral-700 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-between group disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-medium">XUMM Wallet</div>
                <div className="text-xs text-blue-200">
                  Secure XRP wallet connection
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Browser Wallet */}
          <button
            onClick={() => handleWalletConnect('browser')}
            disabled={isConnecting}
            className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800 border border-neutral-700 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-between group disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-neutral-700 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-medium">Other Wallet</div>
                <div className="text-xs text-neutral-400">
                  Connect with your preferred wallet
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Demo Mode */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-neutral-900 text-neutral-500">or</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={isConnecting}
            className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800 border border-neutral-700 border-dashed text-neutral-300 p-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <span>Try Demo Mode</span>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            By connecting your wallet, you agree to stake XRP for your goals.
            <br />
            Complete your tasks to earn rewards!
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-neutral-200 mb-1">
                Secure Authentication
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                We use cryptographic signatures to verify wallet ownership. 
                Your private keys never leave your wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 