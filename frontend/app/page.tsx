"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ComponentType } from "react"
import {
  Search,
  Plus,
  Settings,
  User,
  MoreHorizontal,
  Inbox,
  Calendar,
  Clock,
  FolderOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Target,
  Coins,
  TrendingUp,
  Wallet,
  LucideProps,
} from "lucide-react"
import TaskCard from "@/components/task-card"
import AddTaskModal from "@/components/add-task-modal"
import type { Task } from "@/types/task"

// Pool Value Card Component
const PoolValueCard = ({ 
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
const ProgressCard = ({
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

// Fake hook for goal data management - TODO: Replace with actual API integration
const useGoalData = () => {
  const [goalData, setGoalData] = useState<{
    goal: string
    duration: number
    difficulty: string
  } | null>(null)
  const [currentMonth, setCurrentMonth] = useState(1)
  const [monthWeekProgress, setMonthWeekProgress] = useState<Record<number, number>>({})

  const getCurrentWeek = () => {
    return monthWeekProgress[currentMonth] || 1
  }

  const loadGoalData = () => {
    // TODO: Replace with actual API call
    try {
      const stored = localStorage.getItem('userGoal')
      if (stored) {
        const data = JSON.parse(stored)
        setGoalData(data)
      }
      // Load progress data
      const progress = localStorage.getItem('userProgress')
      if (progress) {
        const { month, monthWeeks } = JSON.parse(progress)
        setCurrentMonth(month || 1)
        setMonthWeekProgress(monthWeeks || {})
      }
    } catch (error) {
      console.error('Failed to load goal data:', error)
    }
  }

  const updateMonth = (month: number) => {
    setCurrentMonth(month)
    // TODO: Save progress to backend
    const progress = localStorage.getItem('userProgress')
    const existingProgress = progress ? JSON.parse(progress) : {}
    localStorage.setItem('userProgress', JSON.stringify({ 
      ...existingProgress, 
      month,
      monthWeeks: monthWeekProgress
    }))
    console.log('Updated month to:', month)
  }

  const updateWeek = (week: number) => {
    const newMonthWeekProgress = {
      ...monthWeekProgress,
      [currentMonth]: week
    }
    setMonthWeekProgress(newMonthWeekProgress)
    // TODO: Save progress to backend
    const progress = localStorage.getItem('userProgress')
    const existingProgress = progress ? JSON.parse(progress) : {}
    localStorage.setItem('userProgress', JSON.stringify({ 
      ...existingProgress, 
      month: currentMonth,
      monthWeeks: newMonthWeekProgress
    }))
    console.log('Updated week to:', week, 'for month:', currentMonth)
  }

  return {
    goalData,
    currentMonth,
    currentWeek: getCurrentWeek(),
    loadGoalData,
    updateMonth,
    updateWeek,
  }
}

// Fake hook for stake data management - TODO: Replace with actual API integration
const useStakeData = () => {
  const [userStake] = useState(0) // User's current stake in XRP
  const [totalPool] = useState(15420.75) // Total pool value in XRP

  return {
    userStake,
    totalPool,
  }
}

// Simple Stake Modal Component - TODO: Implement full functionality
const StakeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [stakeAmount, setStakeAmount] = useState("")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 p-6 rounded-lg w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-neutral-100 mb-4">Stake XRP</h2>
        <p className="text-neutral-400 text-sm mb-6">
          Stake XRP to commit to your goal. Complete your tasks to earn rewards, or lose your stake if you don&apos;t!
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Amount (XRP)
          </label>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-neutral-100 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-neutral-700 rounded-md hover:bg-neutral-600 text-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // TODO: Implement staking logic
              console.log('Staking:', stakeAmount, 'XRP')
              onClose()
            }}
            className="flex-1 px-4 py-2 text-sm bg-yellow-600 rounded-md hover:bg-yellow-700 text-white font-medium transition-colors"
          >
            Stake XRP
          </button>
        </div>
      </div>
    </div>
  )
}

const initialTasks: Task[] = [
  {
    id: "PH-01",
    title: "Set project timeline",
    description: "Specify the duration (e.g., 3 months)",
    priority: "medium",
    completed: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZCwOxhrzD9PFSJIN3BSdkng_SDkplI6av3a1-OmwkhhY7k1kUKhu1e1VM_gx5gN_wG72EH_TPSMaiDFh2vKpz7CVVlLHEUGh-LCF3-KoPI_HlKV6f_tZa5cxy6ub7nFhh7qICdRcBtt1tv3oTT8BfzrufrmOSB4hhUWUh38poBB5m31pya_L5UaB9i23USSR4z3YKocHPm1twQRLZ6Vl-rDKzjt5VOrIvNcULYF3puh3mJSISsuLqtQsBzPaWMQ_bXIyqUQvY5eb3",
  },
  {
    id: "PH-02",
    title: "Week 1: Research & Planning",
    description: "AI generated tasks for the first week.",
    priority: "high",
    completed: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBIkgRTS2Pdt7EW1UR02LxXgSqwu--lnB17uu6qZDZB9pe3Vy54AGacKJvWc21vGr2LS3w8HVbikQxiYSbBtKLwFgI8cE_GTS66-xSqIgXHxWZ3ZCKEm2f38QZK1Z6G1lrTF1eFKL-Oynw3h3Q9IXQA1uJLd6crimsKJVaPru52ezxJXUGpGFll78Dzvjbtk3aho24gkx0yJzZPnLTtZcWLgIfRuumxTNSuJ2UQlMqobHgIT4_sH12tKP6rfS1nBQbRtov1loPsrH-_",
  },
  {
    id: "PH-03",
    title: "Week 2: Design Phase",
    description: "AI generated tasks for visual design.",
    priority: "low",
    completed: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBStsm9fP5PBjElYvX1Y2uX5v_EYTu4MZoPdyzx_iqm0PHVv5ZNjZXLFx_6503YXGJY1RTWS0mqDN5u6IQkmLaYhihO7G6dp18cNMn0P_MZ5R4IX2vsWMG83ogFIuOqaYZ_XyFksJomDYBb55zCXJgnweAXpcCz8OXtSz3uZhgjM6AEjkm4Bxt5_9qnORqAIwHorzCEr0s45bFEX8hOyvbUdK47Pm2VDWEhEgTgJhHgs9FDXSAl0G3qmGHP_UeZc5OZKJR5afRZ3yM-",
  },
  {
    id: "PH-05",
    title: "Submit Week 1 Deliverables",
    description: "AI will verify completion based on requirements.",
    priority: "medium",
    completed: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBjj80LSMV6ctTp1NV5o1v7h83ggtNlMv1hiLyygFS0VUoD_T4X6GeStZnHU-PSI92cvSez4wk7Gmw7kqRjcqO-ehkkP418nOk8ONHNYI9mXZSy-u0M1df04buqIglUXdBbNx06k8SEtkSWMQav79t2vpdi1_EVII0Cym1_gcLExc2f_N9jLJ2S6RQfjEXpDG5MLY81zQeG-Mf02opKskO_XdSU2u-XwD5By4h5iEa24uCJU5uAQ18yxXHPqVI5uNYohCWBwGihK2mf",
  },
  {
    id: "PH-06",
    title: "Week 1 - Research Completed",
    description: "All tasks successfully verified by AI.",
    priority: "medium",
    completed: true,
    completionStatus: "success",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBPyD-CyZky-etvbU_THF1hB16dj8Y8wtLeaXmrjZsgv5Z7TturDKIX4HAwk2nO3Y_ogR2KkE_Z6WqnqbWbazrUU3rKgTd8wx8BeJ7kqMuCzkBWpjqTDHz3FnGNn2whbe1AehN7xLVgqNJyDO58F5r4JcyZjdpqDaLwiVgf7ZMkwIbXbIFWjSfHPs7VkGsFpn5rFdabL9elrR64riQcjyh0RLc_6aScamCvN03gGLzH3_kO8CJ5W6iGZQu8B0HE17sfAymCxy_9Z8jN",
  },
  {
    id: "PH-07",
    title: "Week 2 - Design (Incomplete)",
    description: "Penalized: 30% tasks uncompleted.",
    priority: "high",
    completed: true,
    completionStatus: "failed",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBmxKU8IxulbTErkZUICaB3qSGFzX7WX4XdMkqz38isDSYJ6uj3EqZKUL6nlWB75nWdzsygcZKFWchSy7O6Bgg3u--Z1SKEqkKdmPs5Eioly4YpnbYRGGWjUOaKFiOuC9Z5dd7K5ngjvt96v5T8lGUFZdaLXADMNMwRFJedHWkDPhviDpU5S086X2M48Xb9vaFhHkCH4RVWTb3EA8hXN7Wq2V-4T1k5rFunkI0fD0ZTZg5JcZ_RlO6A2_6Su4yP_W4MN6vcI2-HrFfi",
  },
]

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [walletId, setWalletId] = useState<string | null>(null)
  const router = useRouter()
  const { goalData, currentMonth, currentWeek, loadGoalData, updateMonth, updateWeek } = useGoalData()
  const { userStake, totalPool } = useStakeData()

  // Load goal data on component mount
  useEffect(() => {
    loadGoalData()
  }, [])

  // Load wallet ID from localStorage
  useEffect(() => {
    const storedWalletId = localStorage.getItem('walletId')
    if (storedWalletId) {
      setWalletId(storedWalletId)
    }
  }, [])

  // Redirect to onboarding if no goal data
  useEffect(() => {
    if (goalData === null) {
      // Give some time for localStorage to load before redirecting
      const timer = setTimeout(() => {
        if (goalData === null) {
          router.push('/onboarding')
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [goalData, router])

  const incompleteTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  const filteredIncompleteTasks = incompleteTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredCompletedTasks = completedTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddTask = (newTask: Omit<Task, "id">) => {
    const task: Task = {
      ...newTask,
      id: `PH-${String(tasks.length + 1).padStart(2, "0")}`,
    }
    setTasks([...tasks, task])
    setIsModalOpen(false)
  }

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  const handlePreviousMonth = () => {
    if (currentMonth > 1) {
      updateMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (goalData && currentMonth < goalData.duration) {
      updateMonth(currentMonth + 1)
    }
  }

  const handlePreviousWeek = () => {
    if (currentWeek > 1) {
      updateWeek(currentWeek - 1)
    }
  }

  const handleNextWeek = () => {
    if (currentWeek < 4) {
      updateWeek(currentWeek + 1)
    }
  }

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-600/20 text-green-400'
      case 'medium': return 'bg-yellow-600/20 text-yellow-400'
      case 'hard': return 'bg-red-600/20 text-red-400'
      default: return 'bg-neutral-600/20 text-neutral-400'
    }
  }

  // Show loading state while checking for goal data
  if (goalData === null) {
    return (
      <div className="bg-neutral-900 text-neutral-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading your goals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 text-neutral-100 min-h-screen">
      <div className="flex-1 p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white rounded-sm flex items-center justify-center">
                  <div className="w-2 h-1 bg-white transform rotate-45 translate-y-0.5"></div>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-100">Task Manager</h1>
                <p className="text-sm text-neutral-400">My Tasks</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {walletId && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-neutral-300 font-mono">
                    {walletId.length > 20 ? `${walletId.slice(0, 8)}...${walletId.slice(-8)}` : walletId}
                  </span>
                </div>
              )}
              <button 
                onClick={() => setIsStakeModalOpen(true)}
                className="px-4 py-2 text-sm bg-gradient-to-r from-yellow-600 to-orange-600 rounded-md hover:from-yellow-700 hover:to-orange-700 text-white flex items-center space-x-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Coins className="w-4 h-4" />
                <span>Stake XRP</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 text-sm bg-purple-600 rounded-md hover:bg-purple-700 text-white flex items-center space-x-1 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
              <button className="p-3 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-purple-600 transition-colors">
                <Settings className="w-6 h-6" />
              </button>
              <button className="p-3 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-purple-600 transition-colors">
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Goal Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-semibold text-neutral-100">
                My Goal: <span className="text-purple-400">{goalData.goal}</span>
              </h2>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDifficultyBadgeColor(goalData.difficulty)}`}>
                {goalData.difficulty.charAt(0).toUpperCase() + goalData.difficulty.slice(1)}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-400">
              <Target className="w-4 h-4" />
              <span>{goalData.duration} month{goalData.duration > 1 ? 's' : ''} goal</span>
            </div>
          </div>
          
          {/* Progress and Pool Value Section */}
          <div className="space-y-6">
            {/* Pool Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PoolValueCard
                title="Total Pool Value"
                subtitle="Community stake pool"
                value={`${totalPool.toLocaleString()} XRP`}
                description="Complete your goals to earn from the reward pool"
                icon={TrendingUp}
                gradientFrom="from-yellow-600/10"
                gradientTo="to-orange-600/10"
                valueColor="text-yellow-400"
              />
              <PoolValueCard
                title="Your Stake"
                subtitle="Current commitment"
                value={userStake > 0 ? `${userStake.toLocaleString()} XRP` : 'No stake'}
                description={userStake > 0 ? 'Stay committed to earn rewards!' : 'Stake XRP to commit to your goal'}
                icon={Wallet}
                gradientFrom="from-purple-600/10"
                gradientTo="to-blue-600/10"
                valueColor="text-purple-400"
              />
            </div>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProgressCard
                title="Month Progress"
                current={currentMonth}
                total={goalData.duration}
                onPrevious={handlePreviousMonth}
                onNext={handleNextMonth}
                canGoPrevious={currentMonth > 1}
                canGoNext={currentMonth < goalData.duration}
                progressColor="bg-purple-600"
                indicators={Array.from({ length: goalData.duration }, (_, i) => i + 1)}
                onIndicatorClick={updateMonth}
              />
              <ProgressCard
                title="Week Progress"
                current={currentWeek}
                total={4}
                onPrevious={handlePreviousWeek}
                onNext={handleNextWeek}
                canGoPrevious={currentWeek > 1}
                canGoNext={currentWeek < 4}
                progressColor="bg-green-600"
                indicators={[1, 2, 3, 4]}
                onIndicatorClick={updateWeek}
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
            <input
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md pl-10 pr-4 py-2.5 text-neutral-100 focus:ring-1 focus:ring-purple-600 focus:border-purple-600 outline-none placeholder-neutral-500"
              placeholder="Search tasks..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6">
          <button className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100 transition-colors">
            <Inbox className="w-5 h-5" />
            <span>All Tasks</span>
          </button>
          <button className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100 transition-colors">
            <Calendar className="w-5 h-5" />
            <span>Today</span>
          </button>
          <button className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100 transition-colors">
            <Clock className="w-5 h-5" />
            <span>Upcoming</span>
          </button>
          <button className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100 transition-colors">
            <FolderOpen className="w-5 h-5" />
            <span>Projects</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </button>
        </div>

        {/* Task Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incomplete Tasks */}
          <div className="bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-neutral-100">
                INCOMPLETE TASKS <span className="text-xs text-neutral-500">{filteredIncompleteTasks.length}</span>
              </h3>
              <button className="text-neutral-400 hover:text-neutral-100">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {filteredIncompleteTasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
              ))}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-neutral-100">
                COMPLETED TASKS <span className="text-xs text-neutral-500">{filteredCompletedTasks.length}</span>
              </h3>
              <button className="text-neutral-400 hover:text-neutral-100">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {filteredCompletedTasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTask={handleAddTask} />
      
      {/* Stake Modal */}
      <StakeModal isOpen={isStakeModalOpen} onClose={() => setIsStakeModalOpen(false)} />
    </div>
  )
}


