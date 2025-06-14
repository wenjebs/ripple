"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { X, Upload, Camera, CheckCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import type { Task } from "@/types/task"

interface TaskSubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onSubmit: (taskId: string, data: File[] | string) => void
}

export default function TaskSubmissionModal({ 
  isOpen, 
  onClose, 
  task, 
  onSubmit 
}: TaskSubmissionModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [textSubmission, setTextSubmission] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<{ message: string; comments?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  if (!isOpen || !task) return null

  const isImageTask = task.expected_data_type === 'image'
  const isTextTask = task.expected_data_type === 'text'

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !isImageTask) return
    
    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    )
    
    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5)) // Max 5 photos
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (isImageTask) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (isImageTask) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const canSubmit = () => {
    if (isImageTask) {
      return selectedFiles.length > 0
    }
    if (isTextTask) {
      return textSubmission.trim().length > 0
    }
    return false
  }

  const handleSubmit = async () => {
    if (!canSubmit()) return
    
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)
    
    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token')
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in again.')
      }

      // First, fetch the complete task data to get verification_method and expected_data_type
      const taskResponse = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })

      if (!taskResponse.ok) {
        if (taskResponse.status === 401) {
          throw new Error('Authentication failed. Please log in again.')
        }
        throw new Error('Failed to fetch task details')
      }

      const taskData = await taskResponse.json()

      // Validate that we have the required fields
      if (!taskData.verification_method && !task.description) {
        throw new Error('Task requirement information is missing')
      }

      if (!taskData.expected_data_type) {
        console.warn('Expected data type not found, defaulting to image')
      }

      // Create FormData for submission
      const formData = new FormData()
      formData.append('task', task.id)
      formData.append('requirement', taskData.verification_method || task.description)
      formData.append('requirement_modality_form', taskData.expected_data_type || 'image')

      if (isImageTask) {
        // Add all selected files
        selectedFiles.forEach((file) => {
          formData.append('submission_images', file)
        })
      } else if (isTextTask) {
        // Add text submission
        formData.append('submission_text', textSubmission.trim())
      }

      // Submit to backend
      const response = await fetch(`${API_BASE_URL}/submissions/submit_task_form/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Submission failed' }))
        throw new Error(errorData.detail || `Failed to submit ${isImageTask ? 'photos' : 'text'}`)
      }

      const result = await response.json()
      console.log('Submission successful:', result)
      
      const isVerified = result.verification_result === 'true'
      
      if (isVerified) {
        // Success - show encouraging message and toast
        setSubmitSuccess({
          message: '🎉 Excellent work! Your task has been verified successfully!',
          comments: result.verification_comments
        })
        
        // Show success toast
        toast.success("Task Verified! 🎉", {
          description: "Your task has been completed and moved to the completed section."
        })
        
        onSubmit(task.id, isImageTask ? selectedFiles : textSubmission)
        
        // Keep modal open so user can see the encouraging feedback
      } else {
        // Failed verification - show error and clear uploaded content
        setSubmitError(`Verification failed: ${result.verification_comments || 'Please check your submission and try again.'}`)
        
        // Clear uploaded files and text
        setSelectedFiles([])
        setTextSubmission("")
        
        // Show failure toast
        toast.error("Verification Failed", {
          description: "Please review the feedback and try submitting again."
        })
        
        // Don't close modal, let user try again
      }
    } catch (error) {
      console.error('Error submitting:', error)
      setSubmitError(error instanceof Error ? error.message : `Failed to submit ${isImageTask ? 'photos' : 'text'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedFiles([])
      setTextSubmission("")
      setSubmitError(null)
      setSubmitSuccess(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div>
            <h2 className="text-xl font-semibold text-neutral-100">Submit Proof</h2>
            <p className="text-sm text-neutral-400 mt-1">
              {isImageTask ? 'Upload photos to verify task completion' : 'Provide text response to verify task completion'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Task Info */}
          <div className="mb-6 p-4 bg-neutral-700 rounded-lg">
            <h3 className="font-medium text-neutral-100 mb-1">{task.title}</h3>
            <p className="text-sm text-neutral-400">{task.description}</p>
            {task.verification_method && task.verification_method !== task.description && (
              <p className="text-sm text-neutral-300 mt-2 font-medium">Requirements: {task.verification_method}</p>
            )}
          </div>

          {/* Error Display */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{submitError}</p>
            </div>
          )}

          {/* Success Display */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 font-medium mb-2">{submitSuccess.message}</p>
              {submitSuccess.comments && (
                <p className="text-sm text-green-300">{submitSuccess.comments}</p>
              )}
            </div>
          )}

          {/* Text Submission */}
          {isTextTask && !submitError && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Your Response
              </label>
              <textarea
                value={textSubmission}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setTextSubmission(e.target.value)
                  }
                }}
                placeholder="Enter your response here..."
                className="w-full h-32 px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-neutral-500 mt-2">
                {textSubmission.length}/1000 characters
              </p>
            </div>
          )}

          {/* Image Upload Area */}
          {isImageTask && !submitError && (
            <>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-neutral-600 hover:border-neutral-500"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 bg-neutral-700 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-neutral-100 mb-2">
                      Drop photos here or click to browse
                    </h3>
                    <p className="text-sm text-neutral-400">
                      Upload up to 5 photos (max 10MB each)
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-neutral-300 mb-3">
                    Selected Photos ({selectedFiles.length}/5)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-neutral-700 rounded-lg overflow-hidden">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(index)
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="mt-1">
                          <p className="text-xs text-neutral-400 truncate">{file.name}</p>
                          <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-700">
          <div className="flex items-center space-x-2 text-sm text-neutral-400">
            {isImageTask ? (
              <>
                <Camera className="w-4 h-4" />
                <span>Photos will be reviewed for task verification</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Text will be reviewed for task verification</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-neutral-300 hover:text-neutral-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {submitError && (
              <button
                onClick={() => {
                  setSubmitError(null)
                  setSubmitSuccess(null)
                }}
                className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting || !!submitError}
              className="px-6 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Proof</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 