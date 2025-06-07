"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight, Users, Target, Zap } from "lucide-react"

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Welcome to Task Manager",
    description: "Let's get you set up to maximize your productivity",
    icon: Zap,
    content: "You're now connected with your XRP wallet and ready to start managing your tasks efficiently."
  },
  {
    id: 2,
    title: "Set Your Goal",
    description: "Define what you want to achieve",
    icon: Target,
    content: "form" // This will trigger the goal form
  },
  {
    id: 3,
    title: "Join the Community",
    description: "Connect with other productive individuals",
    icon: Users,
    content: "Share your progress, get motivated, and learn from others in our community."
  }
]

const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy", description: "Light commitment, flexible schedule" },
  { value: "medium", label: "Medium", description: "Moderate effort, regular check-ins" },
  { value: "hard", label: "Hard", description: "High commitment, daily focus required" }
]

const DURATION_OPTIONS = [
  { value: 1, label: "1 month" },
  { value: 2, label: "2 months" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" }
]

// Fake hooks for future backend integration
const useGoalStorage = () => {
  const saveGoal = async (goalData: {
    goal: string
    duration: number
    difficulty: string
  }) => {
    // TODO: Replace with actual API call
    console.log('Saving goal:', goalData)
    localStorage.setItem('userGoal', JSON.stringify(goalData))
  }

  return { saveGoal }
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [goalForm, setGoalForm] = useState({
    goal: '',
    duration: 3,
    difficulty: 'medium'
  })
  const router = useRouter()
  const { saveGoal } = useGoalStorage()

  const currentStepData = ONBOARDING_STEPS.find(step => step.id === currentStep)
  const isLastStep = currentStep === ONBOARDING_STEPS.length
  const isGoalStep = currentStep === 2

  const handleNext = async () => {
    if (isGoalStep) {
      // Validate goal form
      if (!goalForm.goal.trim()) {
        alert('Please enter your goal')
        return
      }
      // Save goal data
      await saveGoal(goalForm)
    }

    if (isLastStep) {
      router.push('/')
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkip = () => {
    router.push('/')
  }

  const handleGoalFormChange = (field: string, value: string | number) => {
    setGoalForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="bg-neutral-900 text-neutral-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {ONBOARDING_STEPS.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.id <= currentStep
                    ? "bg-purple-600 text-white"
                    : "bg-neutral-700 text-neutral-400"
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              {step.id < ONBOARDING_STEPS.length && (
                <div
                  className={`w-16 h-0.5 mx-2 ${
                    step.id < currentStep ? "bg-purple-600" : "bg-neutral-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStepData && (
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <currentStepData.icon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-semibold text-neutral-100 mb-3">
              {currentStepData.title}
            </h1>
            
            <p className="text-neutral-400 mb-6">
              {currentStepData.description}
            </p>

            {/* Goal Form */}
            {currentStepData.content === "form" ? (
              <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700 mb-8 text-left">
                <div className="space-y-6">
                  {/* Goal Input */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      What is your goal?
                    </label>
                    <textarea
                      value={goalForm.goal}
                      onChange={(e) => handleGoalFormChange('goal', e.target.value)}
                      placeholder="e.g., Get healthy and fit, Learn a new skill, Build a business..."
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-3 text-neutral-100 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none placeholder-neutral-500 resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Duration Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      How many months do you want to work on this?
                    </label>
                    <select
                      value={goalForm.duration}
                      onChange={(e) => handleGoalFormChange('duration', parseInt(e.target.value))}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2.5 text-neutral-100 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none"
                    >
                      {DURATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-3">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {DIFFICULTY_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => handleGoalFormChange('difficulty', level.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            goalForm.difficulty === level.value
                              ? "border-purple-600 bg-purple-600/10"
                              : "border-neutral-600 bg-neutral-700 hover:border-neutral-500"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-neutral-100">{level.label}</h4>
                              <p className="text-sm text-neutral-400">{level.description}</p>
                            </div>
                            {goalForm.difficulty === level.value && (
                              <CheckCircle2 className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700 mb-8">
                <p className="text-neutral-200 leading-relaxed">
                  {currentStepData.content}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-neutral-400 hover:text-neutral-100 transition-colors text-sm"
          >
            Skip for now
          </button>
          
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span>{isLastStep ? "Get Started" : "Continue"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Step Counter */}
        <div className="text-center mt-6">
          <p className="text-sm text-neutral-500">
            Step {currentStep} of {ONBOARDING_STEPS.length}
          </p>
        </div>
      </div>
    </div>
  )
} 