"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Shield, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react"

const SUPPORTED_WALLETS = [
  {
    id: "xumm",
    name: "XUMM",
    description: "The most popular XRP Ledger wallet",
    icon: "🔷",
    status: "recommended"
  },
  {
    id: "crossmark",
    name: "Crossmark",
    description: "Multi-chain wallet with XRP support",
    icon: "✖️",
    status: "available"
  },
  {
    id: "gem",
    name: "GEM Wallet",
    description: "Multi-currency wallet for XRPL",
    icon: "💎",
    status: "available"
  }
]

export default function LoginPage() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const router = useRouter()

  const handleWalletConnect = async (walletId: string) => {
    setSelectedWallet(walletId)
    setIsConnecting(true)
    
    // Simulate wallet connection process
    setTimeout(() => {
      setIsConnecting(false)
      // Redirect to onboarding page
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
            Sign in securely with your XRP Ledger wallet to access Task Manager
          </p>
        </div>

        {/* Wallet Options */}
        <div className="space-y-3 mb-6">
          {SUPPORTED_WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletConnect(wallet.id)}
              disabled={isConnecting}
              className={`w-full p-4 rounded-lg border transition-all duration-200 ${
                selectedWallet === wallet.id
                  ? "border-purple-600 bg-purple-600/10"
                  : "border-neutral-700 bg-neutral-800 hover:border-neutral-600 hover:bg-neutral-750"
              } ${isConnecting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{wallet.icon}</div>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-neutral-100">{wallet.name}</h3>
                      {wallet.status === "recommended" && (
                        <span className="px-2 py-0.5 text-xs bg-purple-600/20 text-purple-400 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-400">{wallet.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedWallet === wallet.id && isConnecting ? (
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  ) : selectedWallet === wallet.id ? (
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-neutral-500" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Advanced Options */}
        <div className="mb-6">
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