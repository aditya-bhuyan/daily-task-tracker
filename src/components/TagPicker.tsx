/**
 * TagPicker — Feature 4
 * Multi-select tag picker with inline create.
 * Renders as a compact popover of clickable tag chips.
 */
import { useEffect, useRef, useState } from 'react'
import type { Tag } from '@/types'

const PRESET_COLORS = [
  '#6366f1','#3b82f6','#22c55e','#f59e0b','#ef4444',
  '#ec4899','#8b5cf6','#06b6d4','#f97316','#64748b',
]

interface TagPickerProps {
  taskId: number
  value: Tag[]             // currently-selected tags
  onChange: (tags: Tag[]) => void
}

export function TagPicker({ taskId, value, onChange }: TagPickerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.taskApi.tags.getAll().then(setAllTags).catch(() => {})
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectedIds = new Set(value.map(t => t.id))

  async function toggleTag(tag: Tag) {
    let next: Tag[]
    if (selectedIds.has(tag.id)) {
      next = value.filter(t => t.id !== tag.id)
    } else {
      next = [...value, tag]
    }
    onChange(next)
    await window.taskApi.tags.setTaskTags(taskId, next.map(t => t.id)).catch(() => {})
  }

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    try {
      const tag = await window.taskApi.tags.create(name, newColor)
      setAllTags(prev => {
        if (prev.find(t => t.id === tag.id)) return prev
        return [...prev, tag]
      })
      // Auto-select the new tag
      const next = [...value, tag]
      onChange(next)
      await window.taskApi.tags.setTaskTags(taskId, next.map(t => t.id)).catch(() => {})
      setNewName('')
    } catch { /* silent */ }
  }

  return (
    <div ref={ref} className="relative">
      {/* Selected tags display + open button */}
      <div
        className="flex min-h-[28px] flex-wrap items-center gap-1 cursor-pointer rounded-md border border-input bg-background px-2 py-1 text-xs hover:border-ring"
        onClick={() => setOpen(o => !o)}
      >
        {value.length === 0 && (
          <span className="text-muted-foreground">Add tags…</span>
        )}
        {value.map(t => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: t.color }}
          >
            {t.name}
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); toggleTag(t) }}
              className="cursor-pointer opacity-70 hover:opacity-100"
            >×</span>
          </span>
        ))}
        <span className="ml-auto text-muted-foreground text-xs">🏷</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-2 shadow-md">
          {/* Existing tags */}
          {allTags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {allTags.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white transition-opacity ${selectedIds.has(t.id) ? 'opacity-100 ring-2 ring-white ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: t.color }}
                >
                  {selectedIds.has(t.id) ? '✓ ' : ''}{t.name}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-2">
            <p className="mb-1 text-xs text-muted-foreground font-medium">Create tag</p>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
                placeholder="Tag name"
                className="h-6 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="h-6 rounded bg-primary px-2 text-xs text-primary-foreground disabled:opacity-50"
              >Add</button>
            </div>
            {/* Color picker row */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`h-4 w-4 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-1 ring-ring ring-offset-1' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
