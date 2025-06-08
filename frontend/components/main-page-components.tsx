import { LucideProps, ChevronLeft, ChevronRight } from "lucide-react"
import { ComponentType } from "react"

export const PoolValueCard = ({ 
  title, 
  subtitle, 
  value, 
  description, 
  icon: Icon, 
  gradientFrom, 
  gradientTo, 
  valueColor 
}: {
  title: string
  subtitle: string
  value: string
  description: string
  icon: ComponentType<LucideProps>
  gradientFrom: string
  gradientTo: string
  valueColor: string
}) => (
  <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} border border-opacity-20 rounded-lg p-6`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradientFrom.replace('/10', '')} ${gradientTo.replace('/10', '')} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
          <p className="text-sm text-neutral-400">{subtitle}</p>
        </div>
      </div>
    </div>
    <div className={`text-3xl font-bold ${valueColor} mb-2`}>
      {value}
    </div>
    <p className="text-sm text-neutral-400">
      {description}
    </p>
  </div>
)

// Progress Card Component
export const ProgressCard = ({
  title,
  current,
  total,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  progressColor,
  indicators,
  onIndicatorClick,
}: {
  title: string
  current: number
  total: number
  onPrevious: () => void
  onNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  progressColor: string
  indicators: number[]
  onIndicatorClick: (value: number) => void
}) => (
  <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
      <div className="flex items-center space-x-2">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`p-2 rounded-md transition-colors ${
            !canGoPrevious
              ? "text-neutral-600 cursor-not-allowed"
              : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-2 rounded-md transition-colors ${
            !canGoNext
              ? "text-neutral-600 cursor-not-allowed"
              : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700"
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Progress Bar */}
    <div className="mb-6">
      <div className="w-full bg-neutral-700 rounded-full h-4">
        <div
          className={`${progressColor} h-4 rounded-full transition-all duration-300`}
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-neutral-500 mt-2">
        <span>{title.split(' ')[0]} {current}</span>
        <span>{(current / total * 100).toFixed(0)}%</span>
        <span>of {total}</span>
      </div>
    </div>

    {/* Indicators */}
    <div className="flex items-center space-x-2 justify-center flex-wrap">
      {indicators.map((value) => (
        <button
          key={value}
          onClick={() => onIndicatorClick(value)}
          className={`w-10 h-10 rounded-full text-xs font-medium transition-colors ${
            value === current
              ? `${progressColor.replace('bg-', 'bg-')} text-white`
              : value < current
              ? `${progressColor.replace('bg-', 'bg-').replace('-600', '-400')} text-white`
              : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  </div>
)

