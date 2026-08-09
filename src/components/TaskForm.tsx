import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { TagPicker } from '@/components/TagPicker'
import { useApp } from '@/context/AppContext'
import type { Tag, TaskWithDetails } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecurrenceFormData {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'hourly' | 'custom'
  interval: number
  days_of_week: number[]
  day_of_month: number | ''
  month_of_year: number | ''
  custom_cron: string
  end_type: 'never' | 'on_date' | 'after_n'
  ends_on: string
  ends_after: number | ''
}

interface TaskFormData {
  title: string
  description: string
  category_id: number | ''
  priority: 'low' | 'medium' | 'high'
  due_date: string
  due_time: string
  schedule_type: 'any' | 'weekday' | 'weekend'
  status: 'active' | 'archived'
  recurrenceEnabled: boolean
  recurrence: RecurrenceFormData
}

export interface TaskFormProps {
  initialData?: TaskWithDetails
  onSave: (task: TaskWithDetails) => void
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const defaultRecurrence: RecurrenceFormData = {
  type: 'daily',
  interval: 1,
  days_of_week: [],
  day_of_month: '',
  month_of_year: '',
  custom_cron: '',
  end_type: 'never',
  ends_on: '',
  ends_after: '',
}

function buildInitialData(task?: TaskWithDetails): TaskFormData {
  if (!task) {
    return {
      title: '',
      description: '',
      category_id: '',
      priority: 'medium',
      due_date: '',
      due_time: '',
      schedule_type: 'any',
      status: 'active',
      recurrenceEnabled: false,
      recurrence: { ...defaultRecurrence },
    }
  }
  return {
    title: task.title,
    description: task.description ?? '',
    category_id: task.category_id ?? '',
    priority: task.priority,
    due_date: task.due_date ?? '',
    due_time: task.due_time ?? '',
    schedule_type: task.schedule_type,
    status: task.status,
    recurrenceEnabled: !!task.recurrence,
    recurrence: task.recurrence
      ? {
          type: task.recurrence.type,
          interval: task.recurrence.interval,
          days_of_week: task.recurrence.days_of_week
            ? (JSON.parse(task.recurrence.days_of_week) as number[])
            : [],
          day_of_month: task.recurrence.day_of_month ?? '',
          month_of_year: task.recurrence.month_of_year ?? '',
          custom_cron: task.recurrence.custom_cron ?? '',
          end_type: task.recurrence.ends_on
            ? 'on_date'
            : task.recurrence.ends_after
              ? 'after_n'
              : 'never',
          ends_on: task.recurrence.ends_on ?? '',
          ends_after: task.recurrence.ends_after ?? '',
        }
      : { ...defaultRecurrence },
  }
}

// ---------------------------------------------------------------------------
// Day-of-week picker helper
// ---------------------------------------------------------------------------

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function DayOfWeekPicker({
  value,
  onChange,
}: {
  value: number[]
  onChange: (days: number[]) => void
}) {
  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day])
  }
  return (
    <div className="flex gap-1">
      {DOW_LABELS.map((label, i) => (
        <button
          key={i}
          type="button"
          onClick={() => toggle(i)}
          className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
            value.includes(i)
              ? 'bg-primary text-primary-foreground'
              : 'border border-input bg-background hover:bg-accent'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TaskForm({ initialData, onSave, onCancel }: TaskFormProps) {
  const { categories } = useApp()
  const isEdit = !!initialData
  const [form, setForm] = useState<TaskFormData>(() => buildInitialData(initialData))
  const [selectedTags, setSelectedTags] = useState<Tag[]>(() => initialData?.tags ?? [])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Helper to update a top-level field
  function set<K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Helper to update a recurrence sub-field
  function setRec<K extends keyof RecurrenceFormData>(key: K, value: RecurrenceFormData[K]) {
    setForm((prev) => ({ ...prev, recurrence: { ...prev.recurrence, [key]: value } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    setError(null)
    setSaving(true)

    try {
      const recurrencePayload =
        form.recurrenceEnabled
          ? {
              type: form.recurrence.type,
              interval: form.recurrence.interval,
              days_of_week:
                form.recurrence.type === 'weekly'
                  ? JSON.stringify(form.recurrence.days_of_week)
                  : null,
              day_of_month:
                form.recurrence.type === 'monthly' || form.recurrence.type === 'yearly'
                  ? (form.recurrence.day_of_month as number) || null
                  : null,
              month_of_year:
                form.recurrence.type === 'yearly'
                  ? (form.recurrence.month_of_year as number) || null
                  : null,
              custom_cron:
                form.recurrence.type === 'custom' ? form.recurrence.custom_cron || null : null,
              ends_on:
                form.recurrence.end_type === 'on_date' ? form.recurrence.ends_on || null : null,
              ends_after:
                form.recurrence.end_type === 'after_n'
                  ? (form.recurrence.ends_after as number) || null
                  : null,
            }
          : null

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id !== '' ? (form.category_id as number) : null,
        priority: form.priority,
        due_date: form.due_date || null,
        due_time: form.due_time || null,
        schedule_type: form.schedule_type,
        status: form.status,
        recurrence_id: null, // managed server-side
        recurrence: recurrencePayload ?? undefined,
      }

      let result: TaskWithDetails
      if (isEdit && initialData) {
        result = (await window.taskApi.tasks.update(initialData.id, payload))!
      } else {
        result = await window.taskApi.tasks.create(payload)
      }
      // Persist tags (after task exists so we have its ID)
      if (selectedTags.length > 0 || (initialData?.tags?.length ?? 0) > 0) {
        await window.taskApi.tags.setTaskTags(result.id, selectedTags.map(t => t.id)).catch(() => {})
        result = { ...result, tags: selectedTags }
      }
      onSave(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task.')
    } finally {
      setSaving(false)
    }
  }

  const rec = form.recurrence

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* ── Basic Info ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Basic Info
        </h3>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-title">Title *</Label>
          <Input
            id="task-title"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-desc">Description</Label>
          <Textarea
            id="task-desc"
            placeholder="Optional notes or details…"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              value={form.category_id !== '' ? String(form.category_id) : ''}
              onValueChange={(v) => set('category_id', v ? Number(v) : '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => set('priority', v as TaskFormData['priority'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status — only in edit mode */}
        {isEdit && (
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set('status', v as TaskFormData['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tags — Feature 4 */}
        <div className="flex flex-col gap-1.5">
          <Label>Tags</Label>
          <TagPicker
            taskId={initialData?.id ?? 0}
            value={selectedTags}
            onChange={setSelectedTags}
          />
        </div>
      </section>

      <Separator />

      {/* ── Schedule ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Schedule
        </h3>

        <div className="flex flex-col gap-1.5">
          <Label>Schedule Type</Label>
          <Select
            value={form.schedule_type}
            onValueChange={(v) => set('schedule_type', v as TaskFormData['schedule_type'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Day</SelectItem>
              <SelectItem value="weekday">Weekdays Only</SelectItem>
              <SelectItem value="weekend">Weekends Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due-date">Due Date</Label>
            <input
              id="task-due-date"
              type="date"
              value={form.due_date}
              onChange={(e) => set('due_date', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due-time">Due Time</Label>
            <input
              id="task-due-time"
              type="time"
              value={form.due_time}
              onChange={(e) => set('due_time', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Recurrence ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            🔁 Recurrence
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {form.recurrenceEnabled ? 'On' : 'Off'}
            </span>
            <Switch
              checked={form.recurrenceEnabled}
              onCheckedChange={(checked) => set('recurrenceEnabled', checked)}
              aria-label="Enable recurrence"
            />
          </div>
        </div>

        {form.recurrenceEnabled && (
          <div className="flex flex-col gap-3 pl-4 border-l-2 border-muted">
            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <Label>Repeat</Label>
              <Select
                value={rec.type}
                onValueChange={(v) => setRec('type', v as RecurrenceFormData['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="custom">Custom (cron)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interval */}
            {rec.type !== 'custom' && (
              <div className="flex items-center gap-2">
                <Label className="shrink-0">Every</Label>
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  value={rec.interval}
                  onChange={(e) => setRec('interval', Math.max(1, Number(e.target.value)))}
                />
                <span className="text-sm text-muted-foreground">
                  {rec.type === 'daily'
                    ? 'day(s)'
                    : rec.type === 'weekly'
                      ? 'week(s)'
                      : rec.type === 'monthly'
                        ? 'month(s)'
                        : rec.type === 'yearly'
                          ? 'year(s)'
                          : 'hour(s)'}
                </span>
              </div>
            )}

            {/* Day-of-week picker */}
            {rec.type === 'weekly' && (
              <div className="flex flex-col gap-1.5">
                <Label>On days</Label>
                <DayOfWeekPicker
                  value={rec.days_of_week}
                  onChange={(days) => setRec('days_of_week', days)}
                />
              </div>
            )}

            {/* Day of month */}
            {(rec.type === 'monthly' || rec.type === 'yearly') && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-dom">Day of month</Label>
                <Input
                  id="rec-dom"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="1–31"
                  className="w-24"
                  value={rec.day_of_month}
                  onChange={(e) =>
                    setRec('day_of_month', e.target.value ? Number(e.target.value) : '')
                  }
                />
              </div>
            )}

            {/* Month of year */}
            {rec.type === 'yearly' && (
              <div className="flex flex-col gap-1.5">
                <Label>Month</Label>
                <Select
                  value={rec.month_of_year !== '' ? String(rec.month_of_year) : ''}
                  onValueChange={(v) => setRec('month_of_year', v ? Number(v) : '')}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(
                      (m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom cron */}
            {rec.type === 'custom' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-cron">Cron expression</Label>
                <Input
                  id="rec-cron"
                  placeholder="e.g. 0 9 * * 1-5"
                  value={rec.custom_cron}
                  onChange={(e) => setRec('custom_cron', e.target.value)}
                />
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono leading-5">
                  <span className="font-semibold not-italic text-foreground">Field order: </span>
                  minute(0-59) · hour(0-23) · day-of-month(1-31) · month(1-12) · day-of-week(0-6, 0=Sun)
                  <br/>
                  <span className="font-semibold not-italic text-foreground">Examples: </span>
                  <span className="text-primary">0 9 * * 1-5</span> weekdays 9am ·{' '}
                  <span className="text-primary">0 8,20 * * *</span> 8am &amp; 8pm daily ·{' '}
                  <span className="text-primary">0 9 1 * *</span> 1st of month ·{' '}
                  <span className="text-primary">*/30 * * * *</span> every 30 min
                </div>
              </div>
            )}

            {/* End condition */}
            <div className="flex flex-col gap-1.5">
              <Label>Ends</Label>
              <Select
                value={rec.end_type}
                onValueChange={(v) => setRec('end_type', v as RecurrenceFormData['end_type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="on_date">On a date</SelectItem>
                  <SelectItem value="after_n">After N occurrences</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rec.end_type === 'on_date' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-ends-on">End date</Label>
                <input
                  id="rec-ends-on"
                  type="date"
                  value={rec.ends_on}
                  onChange={(e) => setRec('ends_on', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            )}

            {rec.end_type === 'after_n' && (
              <div className="flex items-center gap-2">
                <Label className="shrink-0">After</Label>
                <Input
                  type="number"
                  min={1}
                  className="w-24"
                  placeholder="N"
                  value={rec.ends_after}
                  onChange={(e) =>
                    setRec('ends_after', e.target.value ? Number(e.target.value) : '')
                  }
                />
                <span className="text-sm text-muted-foreground">occurrences</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Error + Actions ─────────────────────────────────────────────────── */}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}
