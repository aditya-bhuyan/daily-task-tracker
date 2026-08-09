import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useApp, type SelectedView } from '@/context/AppContext'
import { useTheme } from '@/hooks/useTheme'
import type { Category } from '@/types'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function NavItem({
  icon,
  label,
  sublabel,
  active,
  onClick,
}: {
  icon: string
  label: string
  sublabel?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="flex flex-col min-w-0">
        <span className="truncate">{label}</span>
        {sublabel && (
          <span className="text-xs text-muted-foreground truncate">{sublabel}</span>
        )}
      </span>
    </button>
  )
}

function CategoryItem({
  category,
  active,
  onClick,
}: {
  category: Category
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
    >
      {/* Colored dot */}
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      <span className="truncate">{category.icon} {category.name}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar() {
  const { selectedView, setView, categories, todayDate } = useApp()
  const { theme, toggleTheme } = useTheme()

  // Format today's date for the subtitle
  const todayFormatted = new Date(todayDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  function isActive(view: SelectedView): boolean {
    if (typeof selectedView === 'string' && typeof view === 'string') {
      return selectedView === view
    }
    if (typeof selectedView === 'object' && typeof view === 'object') {
      return selectedView.type === view.type && selectedView.id === view.id
    }
    return false
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Logo / Title */}
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="text-2xl leading-none">✅</span>
        <span className="text-lg font-semibold tracking-tight">TaskFlow</span>
      </div>

      <Separator />

      {/* Main navigation */}
      <nav className="flex flex-col gap-1 px-2 py-3">
        <NavItem
          icon="📅"
          label="Today"
          sublabel={todayFormatted}
          active={isActive('today')}
          onClick={() => setView('today')}
        />
        <NavItem
          icon="📋"
          label="All Tasks"
          active={isActive('all')}
          onClick={() => setView('all')}
        />
        <NavItem
          icon="🗓"
          label="Calendar"
          active={isActive('calendar')}
          onClick={() => setView('calendar')}
        />
      </nav>

      <Separator />

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </p>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              active={isActive({ type: 'category', id: cat.id })}
              onClick={() => setView({ type: 'category', id: cat.id })}
            />
          ))}
          {categories.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No categories yet</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Bottom: theme toggle + version */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
          <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </div>
        <Switch
          checked={theme === 'dark'}
          onCheckedChange={toggleTheme}
          aria-label="Toggle dark mode"
        />
      </div>
      <p className="px-4 pb-3 text-xs text-muted-foreground">v0.1.0</p>
    </aside>
  )
}
