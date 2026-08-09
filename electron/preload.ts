import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from './ipc/channels'

// Helper: invoke an IPC channel and unwrap the result envelope
const invoke = <T>(channel: string, ...args: unknown[]): Promise<T> =>
  ipcRenderer.invoke(channel, ...args).then((res: { success: boolean; data?: T; error?: string }) => {
    if (res && res.success === false) throw new Error(res.error)
    return res.data as T
  })

contextBridge.exposeInMainWorld('taskApi', {
  tasks: {
    getAll:    (filters?: unknown) => invoke(IPC.TASKS.GET_ALL, filters),
    getById:   (id: number) => invoke(IPC.TASKS.GET_BY_ID, id),
    getToday:  () => invoke(IPC.TASKS.GET_TODAY),
    getByDate: (date: string) => invoke(IPC.TASKS.GET_BY_DATE, date),
    create:    (data: unknown) => invoke(IPC.TASKS.CREATE, data),
    update:    (id: number, data: unknown) => invoke(IPC.TASKS.UPDATE, id, data),
    delete:    (id: number) => invoke(IPC.TASKS.DELETE, id),
    archive:   (id: number) => invoke(IPC.TASKS.ARCHIVE, id),
  },
  categories: {
    getAll:  () => invoke(IPC.CATEGORIES.GET_ALL),
    create:  (data: unknown) => invoke(IPC.CATEGORIES.CREATE, data),
    update:  (id: number, data: unknown) => invoke(IPC.CATEGORIES.UPDATE, id, data),
    delete:  (id: number) => invoke(IPC.CATEGORIES.DELETE, id),
    reorder: (ids: number[]) => invoke(IPC.CATEGORIES.REORDER, ids),
  },
  completions: {
    markComplete: (task_id: number, occurrence_date: string, notes?: string) =>
      invoke(IPC.COMPLETIONS.MARK_COMPLETE, task_id, occurrence_date, notes),
    markDeferred: (task_id: number, occurrence_date: string, deferred_to: string) =>
      invoke(IPC.COMPLETIONS.MARK_DEFERRED, task_id, occurrence_date, deferred_to),
    markSkipped:  (task_id: number, occurrence_date: string) =>
      invoke(IPC.COMPLETIONS.MARK_SKIPPED, task_id, occurrence_date),
    getForDate:   (date: string) => invoke(IPC.COMPLETIONS.GET_FOR_DATE, date),
    getHistory:   (task_id: number, limit?: number) =>
      invoke(IPC.COMPLETIONS.GET_HISTORY, task_id, limit),
    getStreak:      (task_id: number) => invoke(IPC.COMPLETIONS.GET_STREAK, task_id),
    deleteForDate:  (task_id: number, occurrence_date: string) =>
      invoke(IPC.COMPLETIONS.DELETE_FOR_DATE, task_id, occurrence_date),
  },
  app: {
    getVersion:       () => invoke(IPC.APP.GET_VERSION),
    openDataFolder:   () => invoke(IPC.APP.OPEN_DATA_FOLDER),
    updateTrayCount:  (count: number) => invoke(IPC.APP.UPDATE_TRAY_COUNT, count),
    snoozeTask:       (taskId: number, minutes: number) => invoke(IPC.APP.SNOOZE_TASK, taskId, minutes),
  },
  calendar: {
    getOccurrencesForMonth: (year: number, month: number) =>
      invoke(IPC.TASKS_CALENDAR.GET_OCCURRENCES_FOR_MONTH, year, month),
  },
})
