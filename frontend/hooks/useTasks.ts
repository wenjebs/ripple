import { useMemo } from 'react'
import type { GoalData } from './useGoal'
import type { Task } from '@/types/task'

// Convert backend task to frontend Task format
const convertBackendTask = (backendTask: GoalData['tasks'][0], _index: number): Task => {
  return {
    id: backendTask.id,
    title: backendTask.title,
    description: backendTask.verification_method || 'Complete this task',
    priority: 'medium' as const, // Default priority since backend doesn't have this
    completed: backendTask.verified === 'true',
    completionStatus: backendTask.verified === 'true' ? 'success' : undefined,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${backendTask.title}&backgroundColor=6366f1`, // Generate avatar based on task title
  }
}

export function useTasks(goal: GoalData | undefined, currentWeekNumber?: number) {
  const allTasks = useMemo(() => {
    if (!goal) return []
    return goal.tasks.map((task, index) => convertBackendTask(task, index))
  }, [goal])

  const currentWeekTasks = useMemo(() => {
    if (!goal || !currentWeekNumber) return []
    return goal.tasks
      .filter(task => task.week_number === currentWeekNumber)
      .map((task, index) => convertBackendTask(task, index))
  }, [goal, currentWeekNumber])

  const incompleteTasks = useMemo(() => {
    return allTasks.filter(task => !task.completed)
  }, [allTasks])

  const completedTasks = useMemo(() => {
    return allTasks.filter(task => task.completed)
  }, [allTasks])

  return {
    allTasks,
    currentWeekTasks,
    incompleteTasks,
    completedTasks,
  }
} 