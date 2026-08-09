/**
 * ExportView — Feature 5
 * CSV / JSON export of tasks and completions.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ExportRow, CompletionExportRow } from '@/types'

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSV(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escapeCSV(r[h])).join(',')),
  ]
  return lines.join('\n')
}

// ─── ExportView ───────────────────────────────────────────────────────────────

type Format = 'csv' | 'json'

interface ExportCardProps {
  title: string
  description: string
  icon: string
  onExport: (format: Format) => Promise<void>
  loading: boolean
}

function ExportCard({ title, description, icon, onExport, loading }: ExportCardProps) {
  const [fmt, setFmt] = useState<Format>('csv')

  return (
    <Card>
      <CardContent className="px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>

            <div className="mt-3 flex items-center gap-2">
              {/* Format toggle */}
              <div className="flex rounded-md border border-input overflow-hidden text-xs">
                {(['csv', 'json'] as Format[]).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFmt(f)}
                    className={`px-3 py-1.5 uppercase font-medium transition-colors ${fmt === f ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  >{f}</button>
                ))}
              </div>

              <Button
                size="sm"
                disabled={loading}
                onClick={() => onExport(fmt)}
                className="h-7 text-xs"
              >
                {loading ? '⏳ Exporting…' : '⬇ Export'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ExportView() {
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingComp, setLoadingComp] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleExportTasks(fmt: Format) {
    setLoadingTasks(true); setError(null)
    try {
      const data: ExportRow[] = await window.taskApi.analytics.exportTasks()
      const content = fmt === 'csv'
        ? toCSV(data as unknown as Record<string, unknown>[])
        : JSON.stringify(data, null, 2)
      const filename = `taskflow-tasks-${new Date().toISOString().slice(0,10)}.${fmt}`
      const saved = await window.taskApi.app.saveExportFile(filename, content)
      if (saved) setLastSaved(saved)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally { setLoadingTasks(false) }
  }

  async function handleExportCompletions(fmt: Format) {
    setLoadingComp(true); setError(null)
    try {
      const data: CompletionExportRow[] = await window.taskApi.analytics.exportCompletions()
      const content = fmt === 'csv'
        ? toCSV(data as unknown as Record<string, unknown>[])
        : JSON.stringify(data, null, 2)
      const filename = `taskflow-completions-${new Date().toISOString().slice(0,10)}.${fmt}`
      const saved = await window.taskApi.app.saveExportFile(filename, content)
      if (saved) setLastSaved(saved)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally { setLoadingComp(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Export Data</h2>
        <p className="text-sm text-muted-foreground">Download your TaskFlow data as CSV or JSON.</p>
      </div>

      <div className="space-y-3">
        <ExportCard
          title="Tasks"
          description="All tasks with title, category, priority, recurrence, tags, and status."
          icon="📋"
          onExport={handleExportTasks}
          loading={loadingTasks}
        />
        <ExportCard
          title="Completion History"
          description="Full log of every completed, skipped, or deferred occurrence."
          icon="📊"
          onExport={handleExportCompletions}
          loading={loadingComp}
        />
      </div>

      {lastSaved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          ✅ Saved: <span className="font-medium">{lastSaved}</span>
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive">⚠️ {error}</p>
      )}

      <Card>
        <CardContent className="px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-sm">ℹ️ Export notes</p>
          <p>• <strong>Desktop:</strong> a Save File dialog will appear; choose your destination.</p>
          <p>• <strong>Browser:</strong> file downloads automatically to your Downloads folder.</p>
          <p>• CSV files open in Excel, Google Sheets, or any spreadsheet app.</p>
          <p>• JSON files are useful for scripting or importing into other apps.</p>
        </CardContent>
      </Card>
    </div>
  )
}
