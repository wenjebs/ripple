"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import type { Task, TaskPriority } from "@/types/task"

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (task: Omit<Task, "id">) => void
}

export default function AddTaskModal({ isOpen, onClose, onAddTask }: AddTaskModalProps) {
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskDueDate, setTaskDueDate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskName.trim()) return

    const newTask: Omit<Task, "id"> = {
      title: taskName,
      description: taskDescription || "No description provided",
      priority: "medium" as TaskPriority,
      completed: false,
      dueDate: taskDueDate || undefined,
      avatar: "/placeholder.svg?height=24&width=24",
    }

    onAddTask(newTask)

    // Reset form
    setTaskName("")
    setTaskDescription("")
    setTaskDueDate("")
  }

  const handleClose = () => {
    setTaskName("")
    setTaskDescription("")
    setTaskDueDate("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-neutral-100">Add New Task</h3>
          <button onClick={handleClose} className="text-neutral-400 hover:text-neutral-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-1" htmlFor="taskName">
              Task Name
            </label>
            <input
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2.5 text-neutral-100 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none placeholder-neutral-500"
              id="taskName"
              name="taskName"
              placeholder="e.g., Finish project proposal"
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-1" htmlFor="taskDescription">
              Description (Optional)
            </label>
            <textarea
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2.5 text-neutral-100 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none placeholder-neutral-500"
              id="taskDescription"
              name="taskDescription"
              placeholder="Add more details about the task..."
              rows={3}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-1" htmlFor="taskDueDate">
              Due Date
            </label>
            <input
              className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2.5 text-neutral-100 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none"
              id="taskDueDate"
              name="taskDueDate"
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-sm border border-neutral-600 rounded-md hover:bg-neutral-700 text-neutral-300 hover:text-neutral-100 transition-colors"
              type="button"
              onClick={handleClose}
            >
              Cancel
            </button>
            {/* <button
              className="px-4 py-2 text-sm bg-purple-600 rounded-md hover:bg-purple-700 text-white font-medium transition-colors"
              type="submit"
            >
              Add Task
            </button> */}
          </div>
        </form>
      </div>
    </div>
  )
}
