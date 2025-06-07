"use client"

import XamanLogin from '@/components/XamanLogin'
import { AuthProvider } from '@/hooks/useAuth'

export default function AuthDemoPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Xaman Authentication Demo
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience secure XRP wallet authentication using Xaman&apos;s Universal SDK. 
              Works seamlessly in both browser and xApp environments.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <XamanLogin />
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">How it works:</h2>
            <div className="space-y-3 text-blue-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  1
                </div>
                <p>Click &quot;Connect with Xaman&quot; to start the authentication process</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  2
                </div>
                <p>The SDK automatically detects your environment (browser or xApp)</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  3
                </div>
                <p>Authenticate via OAuth2 (browser) or direct xApp authentication</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  4
                </div>
                <p>You&apos;ll be securely authenticated and see your wallet information</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Prerequisites:</h3>
            <ul className="text-yellow-800 space-y-1">
              <li>• Xaman mobile app (for xApp environment)</li>
              <li>• An XRP wallet set up in Xaman</li>
              <li>• Proper XUMM API credentials configured</li>
              <li>• Works in both browser and xApp environments</li>
            </ul>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
} 