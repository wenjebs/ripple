import { useState, useEffect } from 'react'
import useSWR from 'swr'

// Fetcher function for SWR with authentication
const fetcher = (url: string) => {
  const authToken = localStorage.getItem('auth_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  return fetch(url, { headers }).then(res => {
    if (!res.ok) {
      // If unauthorized, redirect to login
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        window.location.href = '/login'
      }
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    return res.json()
  })
}

// Goal data type based on the backend response
export interface GoalData {
  id: string
  title: string
  duration_weeks: number
  xrp_amount: number
  start_date: string
  status: 'incomplete' | 'completed'
  tasks: Array<{
    id: string
    goal_id: string
    week_number: number
    title: string
    verification_method: string
    expected_data_type: 'image' | 'text'
    verified: 'true' | 'false'
  }>
}

// Hook to fetch goal data by ID
export function useGoal(goalId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<GoalData>(
    goalId ? `/api/goals/status/${goalId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
    }
  )

  return {
    goal: data,
    isLoading,
    isError: !!error,
    error,
    mutate, // For manual revalidation
  }
}

// Hook to get goal ID from localStorage and fetch goal data
export function useCurrentGoal() {
  const [goalId, setGoalId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Only run on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true)
    
    try {
      const stored = localStorage.getItem('userGoal')
      if (stored) {
        const data = JSON.parse(stored)
        setGoalId(data.id || null)
      }
    } catch (error) {
      console.error('Failed to get goal ID from localStorage:', error)
    }
  }, [])

  const { goal, isLoading: isGoalLoading, isError, error, mutate } = useGoal(goalId)

  // Show loading until we know if there's a goal ID or not
  const isLoading = !isClient || isGoalLoading

  return {
    goal,
    goalId,
    isLoading,
    isError,
    error,
    mutate,
    hasGoal: !!goalId,
  }
} 