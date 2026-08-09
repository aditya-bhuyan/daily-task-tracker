/**
 * HeatmapView — Feature 2
 * GitHub-style contribution heatmap of task completions over the past year.
 */
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { HeatmapDay } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

// Build a full 52-week grid of dates ending today
function buildGrid(): string[][] {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  // find last Sunday on or before today
  const endSunday = new Date(today)
  endSunday.setDate(endSunday.getDate() + (7 - endSunday.getDay()) % 7)
  // 52 weeks = 364 days back
  const startDate = addDays(endSunday, -363)
  // align to Sunday
  const cols: string[][] = []
  let cursor = new Date(startDate)
  for (let w = 0; w < 53; w++) {
    const week: string[] = []
    for (let d = 0; d < 7; d++) {
      week.push(isoDate(cursor))
      cursor = addDays(cursor, 1)
    }
    cols.push(week)
  }
  return cols
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['','M','','W','','F','']

// Color scale — 0 = none, 1 = light, 2 = medium, 3 = dark, 4 = max
function cellColor(completed: number): string {
  if (completed === 0) return 'var(--heatmap-0, #ebedf0)'
  if (completed <= 1)  return 'var(--heatmap-1, #9be9a8)'
  if (completed <= 3)  return 'var(--heatmap-2, #40c463)'
  if (completed <= 6)  return 'var(--heatmap-3, #30a14e)'
  return                      'var(--heatmap-4, #216e39)'
}

function cellColorDark(completed: number): string {
  if (completed === 0) return '#161b22'
  if (completed <= 1)  return '#0e4429'
  if (completed <= 3)  return '#006d32'
  if (completed <= 6)  return '#26a641'
  return                      '#39d353'
}

export function HeatmapView() {
  const [dayMap, setDayMap] = useState<Map<string, HeatmapDay>>(new Map())
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{ date: string; data: HeatmapDay | null; x: number; y: number } | null>(null)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    window.taskApi.analytics.getHeatmapData(365)
      .then(days => {
        const m = new Map<string, HeatmapDay>()
        days.forEach(d => m.set(d.date, d))
        setDayMap(m)
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [])

  const grid = buildGrid()
  const today = isoDate(new Date())
  const getColor = isDark ? cellColorDark : cellColor

  // Month labels: find first column where month changes
  const monthLabels: { col: number; label: string }[] = []
  let lastMonth = -1
  grid.forEach((week, col) => {
    const m = new Date(week[0] + 'T00:00:00').getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ col, label: MONTHS[m] })
      lastMonth = m
    }
  })

  const CELL = 14  // px
  const GAP  = 2
  const STEP = CELL + GAP

  const totalCompleted = [...dayMap.values()].reduce((s, d) => s + d.completed, 0)
  const activeDays     = [...dayMap.values()].filter(d => d.completed > 0).length

  if (loading) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading heatmap…</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Activity Heatmap</h2>
        <div className="text-xs text-muted-foreground">
          {totalCompleted} completions · {activeDays} active days
        </div>
      </div>

      <Card>
        <CardContent className="overflow-x-auto px-4 py-5">
          {/* Month row */}
          <svg
            width={grid.length * STEP + 28}
            height={7 * STEP + 28}
            style={{ display: 'block' }}
          >
            {/* Month labels */}
            {monthLabels.map(({ col, label }) => (
              <text
                key={`m-${col}`}
                x={28 + col * STEP}
                y={10}
                fontSize={10}
                className="fill-muted-foreground"
              >{label}</text>
            ))}

            {/* Day-of-week labels */}
            {DAYS.map((label, i) => (
              <text
                key={`d-${i}`}
                x={8}
                y={18 + i * STEP + CELL * 0.8}
                fontSize={9}
                className="fill-muted-foreground"
              >{label}</text>
            ))}

            {/* Cells */}
            {grid.map((week, col) =>
              week.map((date, row) => {
                const d = dayMap.get(date)
                const completed = d?.completed ?? 0
                const isFuture = date > today
                const fill = isFuture ? (isDark ? '#0d1117' : '#f6f8fa') : getColor(completed)
                return (
                  <rect
                    key={date}
                    x={28 + col * STEP}
                    y={16 + row * STEP}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={fill}
                    style={{ cursor: d ? 'pointer' : 'default' }}
                    onMouseEnter={(e) => setTooltip({ date, data: d ?? null, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })
            )}
          </svg>

          {/* Legend */}
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 1, 3, 5, 7].map(n => (
              <div key={n} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: getColor(n) }} />
            ))}
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-2 text-xs shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-medium">{new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          {tooltip.data ? (
            <p className="text-muted-foreground">
              ✅ {tooltip.data.completed} · ⏭ {tooltip.data.skipped} · 📅 {tooltip.data.deferred}
            </p>
          ) : (
            <p className="text-muted-foreground">No activity</p>
          )}
        </div>
      )}
    </div>
  )
}
