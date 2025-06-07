export type TaskPriority = "low" | "medium" | "high"
export type CompletionStatus = "success" | "failed"

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  completed: boolean
  completionStatus?: CompletionStatus
  dueDate?: string
  avatar: string
  // Backend fields
  verification_method?: string
  expected_data_type?: 'image' | 'text'
  verified?: 'true' | 'false'
}
