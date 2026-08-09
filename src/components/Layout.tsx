import type { ReactNode } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function viewTitle(
  selectedView: ReturnType<typeof useApp>['selectedView'],
  categories: ReturnType<typeof useApp>['categories'],
  todayDate: string
): string {
  if (selectedView === 'today') {
    const d = new Date(todayDate + 'T00:00:00')
    const formatted = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    return `Today — ${formatted}`
  }
  if (selectedView === 'all') return 'All Tasks'
  if (selectedView === 'calendar') return 'Calendar'
  if (typeof selectedView === 'object' && selectedView.type === 'category') {
    const cat = categories.find((c) => c.id === selectedView.id)
    return cat ? `${cat.icon} ${cat.name}` : 'Category'
  }
  return 'TaskFlow'
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

interface LayoutProps {
  children: ReactNode
  onAddTask: () => void
}

export function Layout({ children, onAddTask }: LayoutProps) {
  const { selectedView, categories, todayDate } = useApp()
  const title = viewTitle(selectedView, categories, todayDate)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold">{title}</h1>
          <Button onClick={onAddTask} size="sm">
            + Add Task
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
