import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TaskForm } from '@/components/TaskForm'
import type { TaskWithDetails } from '@/types'

export interface TaskModalProps {
  open: boolean
  task?: TaskWithDetails // undefined = create mode, defined = edit mode
  onClose: () => void
  onSaved: (task: TaskWithDetails) => void
}

export function TaskModal({ open, task, onClose, onSaved }: TaskModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="px-6 pb-6">
            <TaskForm
              initialData={task}
              onSave={onSaved}
              onCancel={onClose}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
