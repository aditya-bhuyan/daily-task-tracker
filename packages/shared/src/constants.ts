/**
 * @file constants.ts
 * @description Shared constants, default seed data and colour maps used by both
 *              the TaskFlow desktop and mobile applications.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import type { Category } from './types'

// ─── Default categories seed ──────────────────────────────────────────────────

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Office / Professional',   icon: '💼', color: '#3b82f6', sort_order: 1 },
  { name: 'Health & Fitness',        icon: '🏃', color: '#22c55e', sort_order: 2 },
  { name: 'Finance',                 icon: '💰', color: '#f59e0b', sort_order: 3 },
  { name: 'Study / Academics',       icon: '📚', color: '#8b5cf6', sort_order: 4 },
  { name: 'Spiritual / Mindfulness', icon: '🧘', color: '#ec4899', sort_order: 5 },
  { name: 'Daily Personal Tasks',    icon: '🏠', color: '#06b6d4', sort_order: 6 },
  { name: 'Daily Health Tasks',      icon: '💊', color: '#f97316', sort_order: 7 },
  { name: 'Weekday Tasks',           icon: '📅', color: '#64748b', sort_order: 8 },
  { name: 'Weekend Tasks',           icon: '🎉', color: '#a855f7', sort_order: 9 },
]

// ─── Priority colours ─────────────────────────────────────────────────────────

export const PRIORITY_COLORS: Record<string, string> = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
}

export const PRIORITY_BG_COLORS: Record<string, string> = {
  high:   '#fef2f2',
  medium: '#fffbeb',
  low:    '#f0fdf4',
}

export const PRIORITY_LABELS: Record<string, string> = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
}

// ─── Recurrence type labels ───────────────────────────────────────────────────

export const RECURRENCE_TYPE_LABELS: Record<string, string> = {
  daily:   'Daily',
  weekly:  'Weekly',
  monthly: 'Monthly',
  yearly:  'Yearly',
  hourly:  'Every Hour',
  custom:  'Custom',
}

// ─── Day labels ───────────────────────────────────────────────────────────────

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_LABELS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

// ─── Completion status colours ────────────────────────────────────────────────

export const COMPLETION_COLORS = {
  completed: '#22c55e',
  skipped:   '#94a3b8',
  deferred:  '#f59e0b',
  pending:   '#e2e8f0',
} as const

// ─── App-wide defaults ────────────────────────────────────────────────────────

export const APP_NAME    = 'TaskFlow'
export const APP_VERSION = '1.0.0'
export const DB_NAME     = 'taskflow.db'
export const DB_VERSION  = 2

// ─── Heatmap intensity thresholds ────────────────────────────────────────────

export const HEATMAP_LEVELS = [
  { min: 0,  color: '#ebedf0' },
  { min: 1,  color: '#9be9a8' },
  { min: 3,  color: '#40c463' },
  { min: 6,  color: '#30a14e' },
  { min: 10, color: '#216e39' },
] as const
