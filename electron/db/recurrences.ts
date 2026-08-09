import { getDb } from './database'
import type { Recurrence } from './types'

export function create(data: Omit<Recurrence, 'id'>): Recurrence {
  const db = getDb()
  const result = db
    .prepare<Omit<Recurrence, 'id'>>(
      `INSERT INTO recurrences
         (type, interval, days_of_week, day_of_month, month_of_year, custom_cron, ends_on, ends_after)
       VALUES
         (@type, @interval, @days_of_week, @day_of_month, @month_of_year, @custom_cron, @ends_on, @ends_after)`
    )
    .run(data)
  return getById(result.lastInsertRowid as number)!
}

export function update(
  id: number,
  data: Partial<Omit<Recurrence, 'id'>>
): Recurrence | undefined {
  const existing = getById(id)
  if (!existing) return undefined

  const merged = { ...existing, ...data }
  getDb()
    .prepare<Recurrence>(
      `UPDATE recurrences
       SET type = @type,
           interval = @interval,
           days_of_week = @days_of_week,
           day_of_month = @day_of_month,
           month_of_year = @month_of_year,
           custom_cron = @custom_cron,
           ends_on = @ends_on,
           ends_after = @ends_after
       WHERE id = @id`
    )
    .run({ ...merged, id })

  return getById(id)
}

export function deleteRecurrence(id: number): boolean {
  const result = getDb()
    .prepare<[number]>('DELETE FROM recurrences WHERE id = ?')
    .run(id)
  return result.changes > 0
}

export function getById(id: number): Recurrence | undefined {
  return getDb()
    .prepare<[number], Recurrence>('SELECT * FROM recurrences WHERE id = ?')
    .get(id)
}
