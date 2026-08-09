// UI-facing types — re-exported from api.d.ts shapes so renderer
// code imports from '@/types' rather than directly from 'api.d.ts'.

export type {
  Category,
  Recurrence,
  Tag,
  Subtask,
  Task,
  TaskCompletion,
  TaskWithDetails,
  WeeklyStats,
  HeatmapDay,
  CategoryStat,
  PriorityStat,
  StreakEntry,
  ExportRow,
  CompletionExportRow,
} from './api.d'
