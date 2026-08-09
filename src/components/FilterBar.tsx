import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface FilterState {
  search: string
  priority: 'all' | 'low' | 'medium' | 'high'
  status: 'all' | 'active' | 'archived'
  schedule_type: 'all' | 'any' | 'weekday' | 'weekend'
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  priority: 'all',
  status: 'all',
  schedule_type: 'all',
}

interface FilterBarProps {
  value: FilterState
  onChange: (filters: FilterState) => void
}

// ────────────────────────────────────────────────────────────────────────────
// Chip component
// ────────────────────────────────────────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-0.5 text-xs font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      {children}
    </button>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// FilterBar
// ────────────────────────────────────────────────────────────────────────────

export function FilterBar({ value, onChange }: FilterBarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const search = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange({ ...value, search })
    }, 300)
  }

  function set<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    onChange({ ...value, [key]: val })
  }

  const isFiltered =
    value.search !== '' ||
    value.priority !== 'all' ||
    value.status !== 'all' ||
    value.schedule_type !== 'all'

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
          🔍
        </span>
        <Input
          defaultValue={value.search}
          onChange={handleSearch}
          placeholder="Search tasks…"
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Filter rows */}
      <div className="flex flex-wrap gap-y-2 gap-x-4">
        {/* Priority */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground w-14">Priority</span>
          <div className="flex gap-1">
            {(['all', 'high', 'medium', 'low'] as const).map((p) => (
              <Chip key={p} active={value.priority === p} onClick={() => set('priority', p)}>
                {p === 'all' ? 'All' : p === 'high' ? '🔴 High' : p === 'medium' ? '🟡 Med' : '🟢 Low'}
              </Chip>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground w-14">Status</span>
          <div className="flex gap-1">
            {(['all', 'active', 'archived'] as const).map((s) => (
              <Chip key={s} active={value.status === s} onClick={() => set('status', s)}>
                {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Archived'}
              </Chip>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground w-14">Days</span>
          <div className="flex gap-1">
            {(['all', 'any', 'weekday', 'weekend'] as const).map((d) => (
              <Chip key={d} active={value.schedule_type === d} onClick={() => set('schedule_type', d)}>
                {d === 'all' ? 'All' : d === 'any' ? 'Any' : d === 'weekday' ? 'Weekdays' : 'Weekends'}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Clear button */}
      {isFiltered && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground"
            onClick={() => onChange(DEFAULT_FILTERS)}
          >
            ✕ Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
