"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Xumm } from 'xumm'

// Types
interface User {
  id: string
  wallet_address: string
  created_at: string
  last_login?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isXApp: boolean
  isBrowser: boolean
  account: string | null
  login: () => Promise<boolean>
  logout: () => void
  xumm: InstanceType<typeof Xumm> | null
  redirectToLogin: () => void
}

interface AuthProviderProps {
  children: ReactNode
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Xumm Universal SDK setup - using global instance as recommended
const XUMM_API_KEY = process.env.NEXT_PUBLIC_XUMM_API_KEY

let xummInstance: InstanceType<typeof Xumm> | null = null

const createXummInstance = async (): Promise<InstanceType<typeof Xumm> | null> => {
  if (!xummInstance && XUMM_API_KEY) {
    try {
      xummInstance = new Xumm(XUMM_API_KEY)
      
      console.log('Xumm runtime:', xummInstance.runtime)
      
      return xummInstance
    } catch (error) {
      console.error('Failed to initialize Xumm SDK:', error)
      return null
    }
  }
  return xummInstance
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [account, setAccount] = useState<string | null>(null)
  const [xumm, setXumm] = useState<InstanceType<typeof Xumm> | null>(null)
  const [isXApp, setIsXApp] = useState(false)
  const [isBrowser, setIsBrowser] = useState(false)

  // Track ongoing sync operations to prevent race conditions
  const [syncInProgress, setSyncInProgress] = useState<Set<string>>(new Set())

  const redirectToLogin = () => {
    router.push('/login')
  }

  // Initialize Xumm SDK
  useEffect(() => {
    const initializeXumm = async () => {
      setIsLoading(true)
      
      const xummSDK = await createXummInstance()
      
      if (xummSDK) {
        setXumm(xummSDK)
        
        // Check runtime environment
        setIsXApp(!!xummSDK.runtime.xapp)
        setIsBrowser(!!xummSDK.runtime.browser && !xummSDK.runtime.xapp)
        
        // Setup event listeners based on environment
        if (xummSDK.runtime.xapp) {
          console.log('Running as xApp')
          
          // Get account if already authenticated
          try {
            const userAccount = await xummSDK.user.account
            if (userAccount) {
              setAccount(userAccount)
              await syncUserWithBackend(userAccount)
            }
          } catch {
            console.log('No existing xApp authentication')
          }
        }
        
        if (xummSDK.runtime.browser && !xummSDK.runtime.xapp) {
          console.log('Running as browser app')
          
          // Setup browser event listeners
          xummSDK.on('error', (error: unknown) => {
            console.error('Xumm error:', error)
          })
          
          xummSDK.on('success', async () => {
            console.log('Browser auth success')
            const userAccount = await xummSDK.user.account
            if (userAccount) {
              setAccount(userAccount)
              await syncUserWithBackend(userAccount)
            }
          })
          
          xummSDK.on('retrieved', async () => {
            console.log('Retrieved existing session')
            const userAccount = await xummSDK.user.account
            if (userAccount) {
              setAccount(userAccount)
              await syncUserWithBackend(userAccount)
            }
          })
          
          // The 'retrieved' event will handle existing sessions automatically
          // No need to manually check here to avoid race conditions
        }
      }
      
      setIsLoading(false)
    }

    initializeXumm()
  }, [])

  // Sync user data with backend after Xumm authentication
  const syncUserWithBackend = async (walletAddress: string): Promise<boolean> => {
    // Prevent multiple simultaneous sync operations for the same wallet
    if (syncInProgress.has(walletAddress)) {
      console.log(`Sync already in progress for wallet: ${walletAddress}`)
      return false
    }

    // Check if user is already authenticated with the same wallet
    const storedUser = localStorage.getItem('user_data')
    if (storedUser && user) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.wallet_address === walletAddress) {
          console.log(`User already authenticated for wallet: ${walletAddress}`)
          return true
        }
      } catch (error) {
        console.log('Error parsing stored user data:', error)
      }
    }

    console.log(`Starting sync for wallet: ${walletAddress}`)
    setSyncInProgress(prev => new Set(prev).add(walletAddress))

    try {
      // Request challenge from backend
      const challengeResponse = await fetch(`${API_BASE_URL}/auth/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet_address: walletAddress }),
      })

      if (!challengeResponse.ok) {
        throw new Error('Failed to get challenge from server')
      }

      const { challenge } = await challengeResponse.json()

      // For Xumm Universal SDK authentication, we use a special verification
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: 'xumm_universal_auth',
          challenge,
          xumm_sdk_auth: true
        }),
      })

      if (!verifyResponse.ok) {
        redirectToLogin()
        throw new Error('Authentication verification failed')
      }

      const authData = await verifyResponse.json()

      // Get user data
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error('Failed to get user data')
      }

      const userData = await userResponse.json()

      // Store auth data
      localStorage.setItem('auth_token', authData.access_token)
      localStorage.setItem('user_data', JSON.stringify(userData))

      setUser(userData)
      console.log(`Sync completed successfully for wallet: ${walletAddress}`)
      
      return true
    } catch (error) {
      console.error(`Backend sync failed for wallet ${walletAddress}:`, error)
      return false
    } finally {
      // Always remove from sync tracking when done
      setSyncInProgress(prev => {
        const newSet = new Set(prev)
        newSet.delete(walletAddress)
        return newSet
      })
      console.log(`Sync operation finished for wallet: ${walletAddress}`)
    }
  }

  // Check for existing backend authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user_data')

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            // Clear invalid token and redirect to login
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user_data')
            redirectToLogin()
          }
        } catch (error) {
          console.error('Token validation failed:', error)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          redirectToLogin()
        }
      }
    }

    checkExistingAuth()
  }, [])

  const login = async (): Promise<boolean> => {
    if (!xumm) {
      console.error('Xumm SDK not available')
      return false
    }

    setIsLoading(true)
    
    try {
      if (isXApp) {
        // In xApp environment, user should already be authenticated
        // If not, we can't force authentication from within the xApp
        const userAccount = await xumm.user.account
        if (userAccount) {
          setAccount(userAccount)
          const success = await syncUserWithBackend(userAccount)
          setIsLoading(false)
          return success
        } else {
          throw new Error('xApp user not authenticated')
        }
      } else if (isBrowser) {
        // In browser environment, trigger OAuth2 PKCE flow
        return new Promise((resolve) => {
          const handleSuccess = async () => {
            try {
              const userAccount = await xumm.user.account
              if (userAccount) {
                setAccount(userAccount)
                const success = await syncUserWithBackend(userAccount)
                setIsLoading(false)
                resolve(success)
              } else {
                setIsLoading(false)
                resolve(false)
              }
            } catch (error) {
              console.error('Login failed:', error)
              setIsLoading(false)
              resolve(false)
            }
          }

          // Setup one-time success listener
          xumm.once('success', handleSuccess)
          
          // Trigger authorization
          xumm.authorize().catch((error: Error) => {
            console.error('Authorization failed:', error)
            setIsLoading(false)
            resolve(false)
          })
        })
      } else {
        throw new Error('Unknown runtime environment')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    // Clear backend auth data
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    
    // Reset state
    setUser(null)
    setAccount(null)
    
    // Logout from Xumm if possible
    if (xumm && typeof xumm.logout === 'function') {
      xumm.logout()
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!account,
    isLoading,
    isXApp,
    isBrowser,
    account,
    login,
    logout,
    xumm,
    redirectToLogin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 