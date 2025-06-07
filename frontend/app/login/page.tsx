"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Shield, Eye, EyeOff, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [walletId, setWalletId] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const router = useRouter()

  const handleWalletConnect = async () => {
    if (!walletId.trim()) {
      return
    }
    
    setIsConnecting(true)
    
    // Store wallet ID in localStorage
    localStorage.setItem('walletId', walletId.trim())
    
    // Simulate wallet connection process
    setTimeout(() => {
      setIsConnecting(false)
      // Redirect to main dashboard
      router.push('/onboarding')
    }, 500)
  }

  return (
    <div className="bg-neutral-900 text-neutral-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">
            Connect Your Wallet
          </h1>
          <p className="text-neutral-400 text-sm">
            Enter your XRP Ledger wallet ID to access Task Manager
          </p>
        </div>

        {/* Wallet ID Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Wallet ID
          </label>
          <input
            type="text"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            placeholder="Enter your wallet ID (e.g., rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH)"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-3 text-neutral-100 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none placeholder-neutral-500"
          />
        </div>

        {/* Connect Button */}
        <button
          onClick={handleWalletConnect}
          disabled={isConnecting || !walletId.trim()}
          className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center justify-center space-x-2 ${
            isConnecting || !walletId.trim()
              ? "border-neutral-700 bg-neutral-800 opacity-50 cursor-not-allowed"
              : "border-purple-600 bg-purple-600 hover:bg-purple-700 cursor-pointer"
          }`}
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white font-medium">Connecting...</span>
            </>
          ) : (
            <>
              <span className="text-white font-medium">Connect Wallet</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </>
          )}
        </button>

        {/* Advanced Options */}
        <div className="mb-6 mt-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAdvanced ? "Hide" : "Show"} advanced options</span>
          </button>
          
          {showAdvanced && (
            <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <h4 className="font-medium text-neutral-100 mb-3 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Advanced Connection</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Custom RPC Endpoint
                  </label>
                  <input
                    type="text"
                    placeholder="wss://xrplcluster.com"
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-neutral-100 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none placeholder-neutral-500 text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="testnet"
                    className="w-4 h-4 text-purple-600 bg-neutral-700 border-neutral-600 rounded focus:ring-purple-600"
                  />
                  <label htmlFor="testnet" className="text-sm text-neutral-300">
                    Connect to Testnet
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700 mb-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-neutral-100 mb-1">Secure Connection</h4>
              <p className="text-sm text-neutral-400">
                Your wallet information is never stored on our servers. All transactions require your explicit approval.
              </p>
            </div>
          </div>
        </div>

        {/* Alternative Access */}
        <div className="text-center">
          <p className="text-sm text-neutral-400 mb-3">Don&apos;t have an XRP wallet?</p>
          <button className="text-sm text-purple-600 hover:text-purple-500 font-medium transition-colors">
            Learn how to set up a wallet →
          </button>
        </div>
      </div>
    </div>
  )
} 