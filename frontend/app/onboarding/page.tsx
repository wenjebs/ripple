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
    title: "Set Your Goals",
    description: "Define what you want to achieve",
    icon: Target,
    content: "Create meaningful goals that will guide your daily tasks and help you stay focused."
  },
  {
    id: 3,
    title: "Join the Community",
    description: "Connect with other productive individuals",
    icon: Users,
    content: "Share your progress, get motivated, and learn from others in our community."
  }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  const currentStepData = ONBOARDING_STEPS.find(step => step.id === currentStep)
  const isLastStep = currentStep === ONBOARDING_STEPS.length

  const handleNext = () => {
    if (isLastStep) {
      router.push('/')
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkip = () => {
    router.push('/')
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

            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700 mb-8">
              <p className="text-neutral-200 leading-relaxed">
                {currentStepData.content}
              </p>
            </div>
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