"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import {
  Search,
  Settings,
  User,
  MoreHorizontal,
  Inbox,
  Target,
  Coins,
  TrendingUp,
  Wallet,
  LogOut,
} from "lucide-react"
import TaskCard from "@/components/task-card"
import AddTaskModal from "@/components/add-task-modal"
import TaskSubmissionModal from "@/components/photo-submission-modal"
import QRPaymentCode from "@/components/QRPaymentCode"
import type { Task } from "@/types/task"
import { useCurrentGoal } from "@/hooks/useGoal"
import { useProgress } from "@/hooks/useProgress"
import { useTasks } from "@/hooks/useTasks"
import { toast } from "sonner"
import { PoolValueCard, ProgressCard } from "@/components/main-page-components"
import { getPoolStats } from "./api/goals/pool"; // Adjust the import path as needed


export function useStakeData(walletAddress: string) {
  const [totalPool, setTotalPool] = useState(0);
  const [userStake, setUserStake] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS || ""; 
    setLoading(true);
    setTotalPool(925007)
    console.log("Use Stake: ", walletAddress)
    getPoolStats(POOL_ADDRESS, walletAddress)
      .then((data) => {
        console.log("Use stake data", data)
        setUserStake(data.userXrp);
      })
      .catch((e) => {
        console.error("useStakeData error", e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { userStake, totalPool, loading, error };
}

// Simple Stake Modal Component - QR Code Payment
const StakeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'confirmed' | 'failed'>('pending')
  const [stakeAmount, setStakeAmount] = useState("20") // Default stake amount
  const [amountError, setAmountError] = useState("")

  if (!isOpen) return null

  const validateAmount = (amount: string) => {
    const numAmount = parseFloat(amount)
    if (!amount || amount.trim() === "") {
      return "Please enter an amount"
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      return "Please enter a valid positive number"
    }
    if (numAmount < 1) {
      return "Minimum stake is 1 XRP"
    }
    if (numAmount > 10000) {
      return "Maximum stake is 10,000 XRP"
    }
    return ""
  }

  const handleAmountChange = (value: string) => {
    setStakeAmount(value)
    setAmountError(validateAmount(value))
  }

  const handleCheckPayment = () => {
    const error = validateAmount(stakeAmount)
    if (error) {
      setAmountError(error)
      return
    }
    
    setPaymentStatus('checking')
    // Simulate checking payment status
    setTimeout(() => {
      // In production, you'd check the actual transaction on XRPL
      setPaymentStatus('confirmed')
      setTimeout(() => {
        onClose()
        setPaymentStatus('pending')
        setAmountError("")
      }, 2000)
    }, 2000)
  }

  const handleClose = () => {
    onClose()
    setPaymentStatus('pending')
    setAmountError("")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 p-6 rounded-lg w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-neutral-100 mb-4">Stake XRP</h2>
        
                {paymentStatus === 'pending' && (
          <>
            <p className="text-neutral-400 text-sm mb-6">
              Enter your stake amount and scan the QR code with your XRP wallet. Complete your tasks to earn rewards!
            </p>
            
            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Stake Amount (XRP)
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                step="0.000001"
                value={stakeAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="100"
                className={`w-full bg-neutral-700 border rounded-md px-3 py-2.5 text-neutral-100 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none ${
                  amountError ? 'border-red-500' : 'border-neutral-600'
                }`}
              />
              {amountError && (
                <p className="text-red-400 text-xs mt-1">{amountError}</p>
              )}
              <p className="text-neutral-500 text-xs mt-1">
                Minimum: 1 XRP • Maximum: 10,000 XRP
              </p>
            </div>
            
            <QRPaymentCode
              amount={stakeAmount}
              destination="rK6UzEi6KFvxtrrV2aL6HNZsVe4hKUdjbC"
              network="XRP Testnet"
              className="mb-6"
            />

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm bg-neutral-700 rounded-md hover:bg-neutral-600 text-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckPayment}
                disabled={!!amountError || !stakeAmount.trim()}
                className="flex-1 px-4 py-2 text-sm bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                I&apos;ve Paid
              </button>
            </div>
          </>
        )}

        {paymentStatus === 'checking' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-300 mb-2">Checking Payment...</p>
            <p className="text-neutral-500 text-sm">Verifying transaction on XRP Ledger</p>
          </div>
        )}

        {paymentStatus === 'confirmed' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-400 font-medium mb-2">Payment Confirmed!</p>
            <p className="text-neutral-400 text-sm">Your {parseFloat(stakeAmount).toLocaleString()} XRP stake has been received</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
                         <p className="text-red-400 font-medium mb-2">Payment Not Found</p>
             <p className="text-neutral-400 text-sm">Please try again or contact support</p>
            <button
              onClick={() => setPaymentStatus('pending')}
              className="mt-4 px-4 py-2 text-sm bg-yellow-600 rounded-md hover:bg-yellow-700 text-white font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TaskManager() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [walletId, setWalletId] = useState<string | null>(null)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showMonthTasks, setShowMonthTasks] = useState(false)
  const [walletCopied, setWalletCopied] = useState(false)
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth()
  
  // Use SWR hooks for real data fetching
  const { goal, isLoading, isError, hasGoal, mutate: refreshGoal } = useCurrentGoal()
  const progress = useProgress(goal)
  const wallet = process.env.NEXT_PUBLIC_USER_WALLET || ""
  const { userStake, totalPool} = useStakeData(wallet)
  const { incompleteTasks, completedTasks } = useTasks(goal)

  // Load wallet ID from localStorage
  useEffect(() => {
    const storedWalletId = localStorage.getItem('walletId')
    if (storedWalletId) {
      setWalletId(storedWalletId)
    }
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Redirect to onboarding if no goal data
  useEffect(() => {
    if (!isLoading && !hasGoal && isAuthenticated) {
      router.push('/onboarding')
    }
  }, [isLoading, hasGoal, isAuthenticated, router])

  // Auto redirect to onboarding if goal data fails to load
  useEffect(() => {
    if (!isLoading && isError && isAuthenticated) {
      router.push('/onboarding')
    }
  }, [isLoading, isError, isAuthenticated, router])

  // Helper function to get month and week from week_number
  const getMonthAndWeekFromWeekNumber = (weekNumber: number) => {
    const month = Math.ceil(weekNumber / 4)
    const week = ((weekNumber - 1) % 4) + 1
    return { month, week }
  }

  // Filter tasks based on current month/week selection and search query
  const filterTasksByMonthWeek = (tasks: Task[]) => {
    return tasks.filter((task) => {
      // Check if task matches search query
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      // If showing all tasks, only filter by search query
      if (showAllTasks) {
        return matchesSearch
      }
      
      // Find the original backend task to get week_number
      const backendTask = goal?.tasks.find(t => t.id === task.id)
      if (!backendTask) return false
      
      const { month: taskMonth, week: taskWeek } = getMonthAndWeekFromWeekNumber(backendTask.week_number)
      
      // If showing month tasks, filter by month only
      if (showMonthTasks) {
        const matchesMonth = taskMonth === progress.currentMonth
        return matchesMonth && matchesSearch
      }
      
      // Check if task matches current selected month and week
      const matchesMonthWeek = taskMonth === progress.currentMonth && taskWeek === progress.currentWeek
      
      return matchesMonthWeek && matchesSearch
    })
  }

  const filteredIncompleteTasks = filterTasksByMonthWeek(incompleteTasks)
  const filteredCompletedTasks = filterTasksByMonthWeek(completedTasks)

  const handleAddTask = (newTask: Omit<Task, "id">) => {
    // TODO: Implement adding tasks via API
    console.log('Add task:', newTask)
    setIsModalOpen(false)
  }

  const handleTaskClick = (task: Task) => {
    // Check if task is already completed
    if (task.completed) {
      toast.info("Task Already Completed", {
        description: "This task has already been verified and completed. Great job! 🎉"
      })
      return
    }
    
    setSelectedTask(task)
    setIsPhotoModalOpen(true)
  }

  const handleTaskSubmission = (taskId: string, data: File[] | string) => {
    // Log the submission but don't close modal - let the modal handle its own state
    if (Array.isArray(data)) {
      console.log('Photo submission for task:', taskId, 'Photos:', data.length)
    } else {
      console.log('Text submission for task:', taskId, 'Text length:', data.length)
    }
    // Refresh goal data to update task completion status
    refreshGoal()
    // Modal will stay open to show success/failure messages
    // User can manually close when ready
  }



  const handlePreviousMonth = () => {
    if (progress.canGoPreviousMonth) {
      progress.updateMonth(progress.currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (progress.canGoNextMonth) {
      progress.updateMonth(progress.currentMonth + 1)
    }
  }

  const handlePreviousWeek = () => {
    if (progress.canGoPreviousWeek) {
      progress.updateWeek(progress.currentWeek - 1)
    }
  }

  const handleNextWeek = () => {
    if (progress.canGoNextWeek) {
      progress.updateWeek(progress.currentWeek + 1)
    }
  }

  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setWalletCopied(true)
      toast.success("Wallet address copied!", {
        description: address,
        duration: 3000,
      })
      setTimeout(() => setWalletCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy wallet address: ', err)
      toast.error("Failed to copy address", {
        description: "Please copy manually: " + address,
        duration: 5000,
      })
    }
  }

  console.log("goal", goal)
  console.log("progress", progress)
  console.log("userStake", userStake)
  console.log("totalPool", totalPool)
  console.log("isAuthenticated", isAuthenticated)
  console.log("isLoading", isLoading)
  console.log("isError", isError)
  console.log("hasGoal", hasGoal)
  console.log("authLoading", authLoading)
  console.log("user", user)
  console.log("walletId", walletId)
  // Show loading state while checking authentication or goal data
  if (authLoading || isLoading) {
    return (
      <div className="bg-neutral-900 text-neutral-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">
            {authLoading ? 'Authenticating...' : 'Loading your goals...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error state (will auto-redirect to onboarding)
  if (isError || !goal) {
    return (
      <div className="bg-neutral-900 text-neutral-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Redirecting to onboarding...</p>
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
              {(user?.wallet_address || walletId) && (
                <button
                  onClick={() => copyWalletAddress(user?.wallet_address || walletId || '')}
                  className="hidden md:flex items-center space-x-2 px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 hover:bg-neutral-700 hover:border-purple-500 transition-colors group"
                  title="Click to copy full wallet address"
                >
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-neutral-300 font-mono group-hover:text-purple-300">
                    {(() => {
                      const address = user?.wallet_address || walletId || ''
                      return address.length > 20 ? `${address.slice(0, 8)}...${address.slice(-8)}` : address
                    })()}
                  </span>
                  {walletCopied ? (
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              )}
              <button 
                onClick={() => setIsStakeModalOpen(true)}
                className="px-4 py-2 text-sm bg-gradient-to-r from-yellow-600 to-orange-600 rounded-md hover:from-yellow-700 hover:to-orange-700 text-white flex items-center space-x-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Coins className="w-4 h-4" />
                <span>Stake XRP</span>
              </button>
              {/* <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 text-sm bg-purple-600 rounded-md hover:bg-purple-700 text-white flex items-center space-x-1 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button> */}
              <button className="p-3 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-purple-600 transition-colors">
                <Settings className="w-6 h-6" />
              </button>
              <button className="p-3 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-purple-600 transition-colors">
                <User className="w-6 h-6" />
              </button>
              <button 
                onClick={logout}
                className="p-3 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Goal Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-semibold text-neutral-100">
                My Goal: <span className="text-purple-400">{goal.title}</span>
              </h2>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-400">
              <Target className="w-4 h-4" />
              <span>{progress.totalMonths} month{progress.totalMonths > 1 ? 's' : ''} goal</span>
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
                current={progress.currentMonth}
                total={progress.totalMonths}
                onPrevious={handlePreviousMonth}
                onNext={handleNextMonth}
                canGoPrevious={progress.canGoPreviousMonth}
                canGoNext={progress.canGoNextMonth}
                progressColor="bg-purple-600"
                indicators={Array.from({ length: progress.totalMonths }, (_, i) => i + 1)}
                onIndicatorClick={progress.updateMonth}
              />
              <ProgressCard
                title="Week Progress"
                current={progress.currentWeek}
                total={4}
                onPrevious={handlePreviousWeek}
                onNext={handleNextWeek}
                canGoPrevious={progress.canGoPreviousWeek}
                canGoNext={progress.canGoNextWeek}
                progressColor="bg-green-600"
                indicators={[1, 2, 3, 4]}
                onIndicatorClick={progress.updateWeek}
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
          <button 
            onClick={() => {
              setShowAllTasks(false)
              setShowMonthTasks(false)
            }}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
              !showAllTasks && !showMonthTasks
                ? 'text-blue-100 bg-blue-600 hover:bg-blue-700' 
                : 'text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100'
            }`}
          >
            <Target className="w-5 h-5" />
            <span>Current Week</span>
          </button>
          <button 
            onClick={() => {
              setShowAllTasks(false)
              setShowMonthTasks(true)
            }}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
              showMonthTasks 
                ? 'text-green-100 bg-green-600 hover:bg-green-700' 
                : 'text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span>This Month</span>
          </button>
          <button 
            onClick={() => {
              setShowAllTasks(true)
              setShowMonthTasks(false)
            }}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
              showAllTasks 
                ? 'text-purple-100 bg-purple-600 hover:bg-purple-700' 
                : 'text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100'
            }`}
          >
            <Inbox className="w-5 h-5" />
            <span>All Tasks</span>
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
                <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
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
                <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTask={handleAddTask} />
      
      {/* Stake Modal */}
      <StakeModal isOpen={isStakeModalOpen} onClose={() => setIsStakeModalOpen(false)} />

      {/* Task Submission Modal */}
      <TaskSubmissionModal 
        isOpen={isPhotoModalOpen} 
        onClose={() => {
          setIsPhotoModalOpen(false)
          setSelectedTask(null)
        }} 
        task={selectedTask}
        onSubmit={handleTaskSubmission} 
      />
    </div>
  )
}


