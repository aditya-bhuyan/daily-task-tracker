/**
 * @file api.ts
 * @description Unified TaskApi implementation for React Native / expo-sqlite.
 *              Implements the exact same TaskApi interface shape as window.taskApi
 *              on the desktop, so all screen logic is portable.
 *
 * Usage:
 *   const db = useSQLiteContext()
 *   const api = createApi(db)
 *   const tasks = await api.tasks.getToday()
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import * as SQLite from 'expo-sqlite'
import type { TaskApi } from '@taskflow/shared'
import * as Tasks       from './tasks'
import * as Categories  from './categories'
import * as Completions from './completions'
import * as Subtasks    from './subtasks'
import * as Tags        from './tags'
import * as Analytics   from './analytics'

export function createApi(db: SQLite.SQLiteDatabase): TaskApi {
  return {
    // ── Tasks ──────────────────────────────────────────────────────────────────
    tasks: {
      getAll:     (filters) => Tasks.getAll(db, filters),
      getById:    (id)      => Tasks.getById(db, id),
      getToday:   ()        => Tasks.getToday(db),
      getByDate:  (date)    => Tasks.getByDate(db, date),
      create:     (data)    => Tasks.create(db, data),
      update:     (id, d)   => Tasks.update(db, id, d),
      delete:     (id)      => Tasks.deleteTask(db, id),
      archive:    (id)      => Tasks.archive(db, id),
      reorder:    (ids)     => Tasks.reorder(db, ids),
    },

    // ── Categories ─────────────────────────────────────────────────────────────
    categories: {
      getAll:   ()        => Categories.getAll(db),
      create:   (data)    => Categories.create(db, data),
      update:   (id, d)   => Categories.update(db, id, d),
      delete:   (id)      => Categories.deleteCategory(db, id),
      reorder:  (ids)     => Categories.reorder(db, ids),
    },

    // ── Completions ────────────────────────────────────────────────────────────
    completions: {
      markComplete:  (tid, date, notes) => Completions.markComplete(db, tid, date, notes),
      markDeferred:  (tid, date, to)    => Completions.markDeferred(db, tid, date, to),
      markSkipped:   (tid, date)        => Completions.markSkipped(db, tid, date),
      getForDate:    (date)             => Completions.getForDate(db, date),
      getHistory:    (tid, limit)       => Completions.getHistory(db, tid, limit),
      getStreak:     (tid)              => Completions.getStreak(db, tid),
      deleteForDate: (tid, date)        => Completions.deleteForDate(db, tid, date),
    },

    // ── Subtasks ───────────────────────────────────────────────────────────────
    subtasks: {
      getForTask: (tid)        => Subtasks.getForTask(db, tid),
      create:     (tid, title) => Subtasks.create(db, tid, title),
      update:     (id, d)      => Subtasks.update(db, id, d),
      delete:     (id)         => Subtasks.deleteSubtask(db, id),
      reorder:    (tid, ids)   => Subtasks.reorder(db, tid, ids),
    },

    // ── Tags ───────────────────────────────────────────────────────────────────
    tags: {
      getAll:       ()            => Tags.getAll(db),
      create:       (name, color) => Tags.create(db, name, color),
      update:       (id, d)       => Tags.update(db, id, d),
      delete:       (id)          => Tags.deleteTag(db, id),
      setTaskTags:  (tid, ids)    => Tags.setTaskTags(db, tid, ids),
      getForTask:   (tid)         => Tags.getForTask(db, tid),
    },

    // ── Analytics ──────────────────────────────────────────────────────────────
    analytics: {
      getWeeklyStats:   (offset)   => Analytics.getWeeklyStats(db, offset),
      getHeatmapData:   (days)     => Analytics.getHeatmapData(db, days),
      exportTasks:      ()         => Analytics.exportTasks(db),
      exportCompletions:()         => Analytics.exportCompletions(db),
    },

    // ── Calendar ───────────────────────────────────────────────────────────────
    calendar: {
      getOccurrencesForMonth: (y, m) => Tasks.getOccurrencesForMonth(db, y, m),
    },
  }
}
