"use client"

import { useState, useRef } from "react"
import { X, Upload, Camera, CheckCircle } from "lucide-react"
import type { Task } from "@/types/task"

interface PhotoSubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onSubmit: (taskId: string, photos: File[]) => void
}

export default function PhotoSubmissionModal({ 
  isOpen, 
  onClose, 
  task, 
  onSubmit 
}: PhotoSubmissionModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !task) return null

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    )
    
    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5)) // Max 5 photos
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return
    
    setIsSubmitting(true)
    
    try {
      // TODO: Replace with actual API call when endpoint is ready
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      onSubmit(task.id, selectedFiles)
      
      // Reset form
      setSelectedFiles([])
      onClose()
    } catch (error) {
      console.error('Error submitting photos:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedFiles([])
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
            <p className="text-sm text-neutral-400 mt-1">Upload photos to verify task completion</p>
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
          </div>

          {/* File Upload Area */}
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
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-700">
          <div className="flex items-center space-x-2 text-sm text-neutral-400">
            <Camera className="w-4 h-4" />
            <span>Photos will be reviewed for task verification</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-neutral-300 hover:text-neutral-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || isSubmitting}
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