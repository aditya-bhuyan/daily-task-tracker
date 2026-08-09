import { useEffect, useState } from 'react'
import { AppProvider, useApp } from '@/context/AppContext'
import { Layout } from '@/components/Layout'
import { TaskModal } from '@/components/TaskModal'
import { TodayView } from '@/pages/TodayView'
import { AllTasksView } from '@/pages/AllTasksView'
import { CategoryView } from '@/pages/CategoryView'
import { CalendarView } from '@/pages/CalendarView'
import { WeeklyReviewView } from '@/pages/WeeklyReviewView'
import { HeatmapView } from '@/pages/HeatmapView'
import { ExportView } from '@/pages/ExportView'
import {
  requestNotificationPermission,
  startBrowserScheduler,
  stopBrowserScheduler,
} from '@/lib/browserNotifications'
import type { TaskWithDetails } from '@/types'

// ---------------------------------------------------------------------------
// Browser notification bootstrap — runs once, only outside Electron
// ---------------------------------------------------------------------------

const IS_ELECTRON = typeof window !== 'undefined' && 'electron' in window

async function bootstrapBrowserNotifications() {
  if (IS_ELECTRON) return // Electron handles its own notifications via node-cron
  const granted = await requestNotificationPermission()
  if (!granted) return
  startBrowserScheduler(() => window.taskApi.tasks.getToday())
}

// ---------------------------------------------------------------------------
// Inner app — consumes AppContext
// ---------------------------------------------------------------------------

function AppShell() {
  const { selectedView, triggerRefresh } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithDetails | undefined>(undefined)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null)

  // Bootstrap browser notifications once on mount
  useEffect(() => {
    if (IS_ELECTRON) return
    if (!('Notification' in window)) return

    setNotifPermission(Notification.permission)
    bootstrapBrowserNotifications().then(() => {
      setNotifPermission(Notification.permission)
    })

    return () => stopBrowserScheduler()
  }, [])

  // Feature 8: Listen for global hotkey 'quick-add-task' from main process
  useEffect(() => {
    if (!IS_ELECTRON) return
    const bridge = (window as unknown as { electronBridge?: { on: (ch: string, cb: () => void) => void; off: (ch: string, cb: () => void) => void } }).electronBridge
    if (!bridge) return
    const handler = () => { setEditingTask(undefined); setModalOpen(true) }
    bridge.on('quick-add-task', handler)
    return () => bridge.off('quick-add-task', handler)
  }, [])

  function handleAddTask() {
    setEditingTask(undefined)
    setModalOpen(true)
  }

  function handleModalSaved() {
    setModalOpen(false)
    setEditingTask(undefined)
    triggerRefresh()
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditingTask(undefined)
  }

  function renderView() {
    if (selectedView === 'today')    return <TodayView />
    if (selectedView === 'all')      return <AllTasksView />
    if (selectedView === 'calendar') return <CalendarView />
    if (selectedView === 'weekly')   return <WeeklyReviewView />
    if (selectedView === 'heatmap')  return <HeatmapView />
    if (selectedView === 'export')   return <ExportView />
    if (typeof selectedView === 'object' && selectedView.type === 'category') {
      return <CategoryView categoryId={selectedView.id} />
    }
    return null
  }

  return (
    <>
      <Layout onAddTask={handleAddTask}>{renderView()}</Layout>

      {/* Browser-only notification permission banner */}
      {!IS_ELECTRON && notifPermission === 'denied' && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-md dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          🔔 Notifications are blocked in your browser. Enable them in browser settings to receive task reminders.
        </div>
      )}
      {!IS_ELECTRON && notifPermission === 'default' && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-md dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          🔔 Allow notifications to get task reminders.{' '}
          <button
            className="font-medium underline hover:no-underline"
            onClick={() => bootstrapBrowserNotifications().then(() => setNotifPermission(Notification.permission))}
          >
            Enable
          </button>
        </div>
      )}

      <TaskModal
        open={modalOpen}
        task={editingTask}
        onClose={handleModalClose}
        onSaved={handleModalSaved}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Root App — provides context
// ---------------------------------------------------------------------------

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

export default App
