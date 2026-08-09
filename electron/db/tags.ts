import { getDb } from './database'

export interface Tag {
  id: number
  name: string
  color: string
}

export function getAll(): Tag[] {
  return getDb().prepare<[], Tag>('SELECT * FROM tags ORDER BY name ASC').all()
}

export function getForTask(task_id: number): Tag[] {
  return getDb()
    .prepare<[number], Tag>(
      `SELECT t.* FROM tags t
       JOIN task_tags tt ON tt.tag_id = t.id
       WHERE tt.task_id = ?
       ORDER BY t.name ASC`
    )
    .all(task_id)
}

export function create(name: string, color = '#6366f1'): Tag {
  const db = getDb()
  // upsert: if name already exists, just return it
  db.prepare<[string, string]>('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)').run(name.trim(), color)
  return db.prepare<[string], Tag>('SELECT * FROM tags WHERE name = ? COLLATE NOCASE').get(name.trim())!
}

export function update(id: number, data: Partial<Omit<Tag, 'id'>>): Tag | undefined {
  const db = getDb()
  const existing = db.prepare<[number], Tag>('SELECT * FROM tags WHERE id = ?').get(id)
  if (!existing) return undefined
  const merged = { name: data.name ?? existing.name, color: data.color ?? existing.color, id }
  db.prepare<typeof merged>('UPDATE tags SET name = @name, color = @color WHERE id = @id').run(merged)
  return db.prepare<[number], Tag>('SELECT * FROM tags WHERE id = ?').get(id)!
}

export function deleteTag(id: number): boolean {
  return getDb().prepare<[number]>('DELETE FROM tags WHERE id = ?').run(id).changes > 0
}

export function setTaskTags(task_id: number, tag_ids: number[]): void {
  const db = getDb()
  const run = db.transaction(() => {
    db.prepare<[number]>('DELETE FROM task_tags WHERE task_id = ?').run(task_id)
    const ins = db.prepare<[number, number]>('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)')
    for (const tag_id of tag_ids) ins.run(task_id, tag_id)
  })
  run()
}
