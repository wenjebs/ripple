"use client"

import Image from "next/image"
import { ArrowUp, AlertTriangle, ArrowDown, Upload, CheckCircle, XCircle } from "lucide-react"
import type { Task } from "@/types/task"

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "high":
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case "medium":
      return <ArrowUp className="w-4 h-4 text-yellow-500" />
    case "low":
      return <ArrowDown className="w-4 h-4 text-green-500" />
    default:
      return <Upload className="w-4 h-4 text-blue-500" />
  }
}

const getCompletionIcon = (status?: string) => {
  switch (status) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <CheckCircle className="w-4 h-4 text-green-500" />
  }
}

const getBorderColor = (task: Task) => {
  if (task.completed) {
    return task.completionStatus === "failed" ? "border-red-500" : "border-green-500"
  }
  return "border-neutral-700 hover:border-purple-600"
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      className={`bg-neutral-900 p-3 rounded-md border cursor-pointer transition-colors ${getBorderColor(task)} ${
        task.completed ? "opacity-70" : ""
      }`}
      onClick={() => onClick(task)}
    >
      <p className={`text-sm text-neutral-100 mb-1 ${task.completed ? "line-through" : ""}`}>{task.title}</p>
      <p className="text-xs text-neutral-400 mb-2">{task.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {task.completed ? getCompletionIcon(task.completionStatus) : getPriorityIcon(task.priority)}
          <span className="text-xs text-neutral-500">{task.id}</span>
        </div>
        <Image
          src={task.avatar || "/placeholder.svg"}
          alt="Avatar"
          width={24}
          height={24}
          className="h-6 w-6 rounded-full"
        />
      </div>
    </div>
  )
}
