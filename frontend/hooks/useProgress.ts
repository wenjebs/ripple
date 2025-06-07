import { useState, useEffect } from 'react'
import type { GoalData } from './useGoal'

interface ProgressState {
  currentMonth: number
  currentWeek: number
  monthWeekProgress: Record<number, number>
}

export function useProgress(goal: GoalData | undefined) {
  const [progressState, setProgressState] = useState<ProgressState>({
    currentMonth: 1,
    currentWeek: 1,
    monthWeekProgress: {},
  })

  // Calculate total months from duration_weeks
  const totalMonths = goal ? Math.ceil(goal.duration_weeks / 4) : 1

  // Load progress from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('userProgress')
      if (stored) {
        const data = JSON.parse(stored)
        setProgressState({
          currentMonth: data.month || 1,
          currentWeek: data.currentWeek || 1,
          monthWeekProgress: data.monthWeeks || {},
        })
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }, [])

  // Save progress to localStorage whenever it changes
  const saveProgress = (newState: ProgressState) => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('userProgress', JSON.stringify({
        month: newState.currentMonth,
        currentWeek: newState.currentWeek,
        monthWeeks: newState.monthWeekProgress,
      }))
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const updateMonth = (month: number) => {
    if (month < 1 || month > totalMonths) return

    const newState = {
      ...progressState,
      currentMonth: month,
      currentWeek: progressState.monthWeekProgress[month] || 1,
    }
    setProgressState(newState)
    saveProgress(newState)
  }

  const updateWeek = (week: number) => {
    if (week < 1 || week > 4) return

    const newMonthWeekProgress = {
      ...progressState.monthWeekProgress,
      [progressState.currentMonth]: week,
    }

    const newState = {
      ...progressState,
      currentWeek: week,
      monthWeekProgress: newMonthWeekProgress,
    }
    setProgressState(newState)
    saveProgress(newState)
  }

  // Calculate current week number across all weeks (1-based)
  const getCurrentWeekNumber = () => {
    return ((progressState.currentMonth - 1) * 4) + progressState.currentWeek
  }

  // Get tasks for current week
  const getCurrentWeekTasks = () => {
    if (!goal) return []
    
    const currentWeekNumber = getCurrentWeekNumber()
    return goal.tasks.filter(task => task.week_number === currentWeekNumber)
  }

  // Calculate completion stats
  const getCompletionStats = () => {
    if (!goal) return { completed: 0, total: 0, percentage: 0 }

    const completed = goal.tasks.filter(task => task.verified === 'true').length
    const total = goal.tasks.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, percentage }
  }

  return {
    currentMonth: progressState.currentMonth,
    currentWeek: progressState.currentWeek,
    totalMonths,
    updateMonth,
    updateWeek,
    getCurrentWeekNumber,
    getCurrentWeekTasks,
    getCompletionStats,
    canGoPreviousMonth: progressState.currentMonth > 1,
    canGoNextMonth: progressState.currentMonth < totalMonths,
    canGoPreviousWeek: progressState.currentWeek > 1,
    canGoNextWeek: progressState.currentWeek < 4,
  }
} 