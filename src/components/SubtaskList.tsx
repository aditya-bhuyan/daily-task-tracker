/**
 * SubtaskList — Feature 3
 * Inline expandable checklist under a task card.
 * Supports add, toggle complete, delete, and drag-to-reorder.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Subtask } from '@/types'

interface SubtaskListProps {
  taskId: number
}

interface DragState {
  dragging: number | null   // subtask id being dragged
  over: number | null       // subtask id being hovered
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const [items, setItems] = useState<Subtask[]>([])
  const [addText, setAddText] = useState('')
  const [adding, setAdding] = useState(false)
  const [drag, setDrag] = useState<DragState>({ dragging: null, over: null })
  const inputRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(() => {
    window.taskApi.subtasks.getForTask(taskId).then(setItems).catch(() => {})
  }, [taskId])

  useEffect(() => { reload() }, [reload])

  async function handleAdd() {
    const title = addText.trim()
    if (!title) return
    setAdding(true)
    try {
      await window.taskApi.subtasks.create(taskId, title)
      setAddText('')
      reload()
    } finally { setAdding(false) }
  }

  async function handleToggle(id: number, completed: boolean) {
    await window.taskApi.subtasks.update(id, { completed: !completed }).catch(() => {})
    setItems(prev => prev.map(s => s.id === id ? { ...s, completed: !completed } : s))
  }

  async function handleDelete(id: number) {
    await window.taskApi.subtasks.delete(id).catch(() => {})
    setItems(prev => prev.filter(s => s.id !== id))
  }

  // ── Drag-to-reorder ──────────────────────────────────────────────────────
  function handleDragStart(id: number) { setDrag(d => ({ ...d, dragging: id })) }
  function handleDragOver(e: React.DragEvent, id: number) { e.preventDefault(); setDrag(d => ({ ...d, over: id })) }
  async function handleDrop() {
    if (drag.dragging === null || drag.over === null || drag.dragging === drag.over) {
      setDrag({ dragging: null, over: null }); return
    }
    const ids = [...items].map(s => s.id)
    const fromIdx = ids.indexOf(drag.dragging)
    const toIdx   = ids.indexOf(drag.over)
    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, drag.dragging)
    // Optimistic update
    const newItems = reordered.map((id, i) => {
      const s = items.find(s => s.id === id)!
      return { ...s, sort_order: i }
    })
    setItems(newItems)
    setDrag({ dragging: null, over: null })
    await window.taskApi.subtasks.reorder(taskId, reordered).catch(() => {})
  }

  const completed = items.filter(s => s.completed).length

  return (
    <div className="mt-2 space-y-1">
      {/* Progress bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${items.length > 0 ? (completed / items.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{completed}/{items.length}</span>
        </div>
      )}

      {/* Items */}
      {items.map(s => (
        <div
          key={s.id}
          draggable
          onDragStart={() => handleDragStart(s.id)}
          onDragOver={(e) => handleDragOver(e, s.id)}
          onDrop={handleDrop}
          onDragEnd={() => setDrag({ dragging: null, over: null })}
          className={`flex items-center gap-2 rounded px-1 py-0.5 transition-colors ${drag.over === s.id && drag.dragging !== s.id ? 'bg-accent' : ''}`}
        >
          {/* drag handle */}
          <span className="cursor-grab text-muted-foreground opacity-40 select-none text-xs">⠿</span>
          {/* checkbox */}
          <input
            type="checkbox"
            checked={s.completed}
            onChange={() => handleToggle(s.id, s.completed)}
            className="h-3.5 w-3.5 cursor-pointer accent-green-500"
          />
          <span className={`flex-1 text-xs ${s.completed ? 'line-through text-muted-foreground' : ''}`}>
            {s.title}
          </span>
          <button
            type="button"
            onClick={() => handleDelete(s.id)}
            className="text-muted-foreground opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 focus:opacity-100 text-xs"
            aria-label="Delete subtask"
          >✕</button>
        </div>
      ))}

      {/* Add new */}
      <div className="flex items-center gap-1 pt-1">
        <Input
          ref={inputRef}
          value={addText}
          onChange={e => setAddText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="Add sub-task…"
          className="h-6 flex-1 text-xs px-2"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          disabled={!addText.trim() || adding}
          onClick={handleAdd}
        >+</Button>
      </div>
    </div>
  )
}
