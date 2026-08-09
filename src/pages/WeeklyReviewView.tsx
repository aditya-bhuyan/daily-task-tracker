/**
 * WeeklyReviewView — Feature 1
 * Shows completion stats, per-category/priority breakdown,
 * top streaks, and week-over-week navigation.
 */
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { WeeklyStats } from '@/types'

// ─── Tiny bar chart (pure CSS/SVG — no chart lib dep) ────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-7 text-right tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  )
}

// ─── Donut completion ring (SVG) ──────────────────────────────────────────────

function CompletionRing({ rate }: { rate: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (rate / 100) * circ
  return (
    <svg viewBox="0 0 84 84" className="h-24 w-24">
      <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
      <circle
        cx="42" cy="42" r={r} fill="none"
        stroke={rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444'}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 42 42)"
        className="transition-all duration-700"
      />
      <text x="42" y="46" textAnchor="middle" className="fill-foreground text-sm font-semibold" fontSize="16">
        {rate}%
      </text>
    </svg>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const fmt = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

export function WeeklyReviewView() {
  const [stats, setStats] = useState<WeeklyStats | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (offset: number) => {
    setLoading(true)
    try {
      const data = await window.taskApi.analytics.getWeeklyStats(offset)
      setStats(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(weekOffset) }, [weekOffset, load])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        Loading weekly stats…
      </div>
    )
  }

  if (!stats) return null

  const maxCatTotal = Math.max(...stats.by_category.map(c => c.total), 1)
  const maxPriTotal = Math.max(...stats.by_priority.map(p => p.total), 1)

  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Weekly Review</h2>
          <p className="text-sm text-muted-foreground">{formatDateRange(stats.week_start, stats.week_end)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(o => o - 1)}>← Prev</Button>
          {weekOffset < 0 && (
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>This Week</Button>
          )}
          <Button variant="outline" size="sm" disabled={weekOffset >= 0} onClick={() => setWeekOffset(o => o + 1)}>Next →</Button>
        </div>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Scheduled', value: stats.total_scheduled, icon: '📋', color: 'text-foreground' },
          { label: 'Completed', value: stats.completed, icon: '✅', color: 'text-green-600 dark:text-green-400' },
          { label: 'Skipped', value: stats.skipped, icon: '⏭', color: 'text-muted-foreground' },
          { label: 'Deferred', value: stats.deferred, icon: '📅', color: 'text-amber-500' },
        ].map(({ label, value, icon, color }) => (
          <Card key={label}>
            <CardContent className="px-4 py-3">
              <p className="text-xs text-muted-foreground">{icon} {label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completion ring + category breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Completion rate */}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-4 py-5">
            <p className="text-sm font-medium">Completion Rate</p>
            <CompletionRing rate={stats.completion_rate} />
            <p className="text-xs text-muted-foreground text-center">
              {stats.completed} of {stats.total_scheduled} tasks completed this week
            </p>
          </CardContent>
        </Card>

        {/* By priority */}
        <Card>
          <CardContent className="px-4 py-4">
            <p className="mb-3 text-sm font-medium">By Priority</p>
            {stats.by_priority.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet this week</p>
            ) : (
              <div className="space-y-3">
                {stats.by_priority.map(p => (
                  <div key={p.priority}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="capitalize font-medium">{p.priority}</span>
                      <span className="text-muted-foreground">{p.completed}/{p.total}</span>
                    </div>
                    <MiniBar value={p.completed} max={maxPriTotal} color={PRIORITY_COLORS[p.priority] ?? '#6366f1'} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By category */}
      {stats.by_category.length > 0 && (
        <Card>
          <CardContent className="px-4 py-4">
            <p className="mb-3 text-sm font-medium">By Category</p>
            <div className="space-y-3">
              {stats.by_category.map(cat => (
                <div key={String(cat.category_id)}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{cat.category_icon} {cat.category_name}</span>
                    <span className="text-muted-foreground">{cat.completed}/{cat.total}</span>
                  </div>
                  <MiniBar value={cat.completed} max={maxCatTotal} color="#6366f1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top streaks */}
      {stats.top_streaks.length > 0 && (
        <Card>
          <CardContent className="px-4 py-4">
            <p className="mb-3 text-sm font-medium">🔥 Current Streaks</p>
            <div className="space-y-2">
              {stats.top_streaks.map(s => (
                <div key={s.task_id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{s.title}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    {s.streak} day{s.streak !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.total_scheduled === 0 && (
        <p className="text-center text-sm text-muted-foreground py-6">
          No tasks were recorded this week. Start completing tasks to see stats here!
        </p>
      )}
    </div>
  )
}
