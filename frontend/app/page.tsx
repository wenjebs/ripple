"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  Plus,
  Settings,
  User,
  MoreHorizontal,
  Inbox,
  Calendar,
  Clock,
  FolderOpen,
  ChevronDown,
} from "lucide-react"
import TaskCard from "@/components/task-card"
import AddTaskModal from "@/components/add-task-modal"
import type { Task } from "@/types/task"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [activeWeek, setActiveWeek] = useState(1)

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
              <button className="px-4 py-2 text-sm bg-neutral-700 rounded-md hover:bg-neutral-600 text-neutral-100 flex items-center space-x-1 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
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
          <h2 className="text-2xl font-semibold text-neutral-100 mb-2">
            My Goal: <span className="text-purple-400">Trying to get healthy</span>
          </h2>
          <div className="flex items-center space-x-2 p-1 bg-neutral-800 rounded-lg">
            {[1, 2, 3, 4].map((week) => (
              <button
                key={week}
                onClick={() => setActiveWeek(week)}
                className={`px-4 py-2 text-sm font-medium rounded-md flex-1 text-center transition-colors ${
                  activeWeek === week
                    ? "text-neutral-100 bg-purple-600"
                    : "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100"
                }`}
              >
                Week {week}
              </button>
            ))}
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
    </div>
  )
}
