/**
 * @file app/modal/task-form.tsx
 * @description Create / Edit task modal screen.
 *              Supports all fields: title, description, category, priority,
 *              due date/time, recurrence, schedule type, tags, and subtasks.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert, Switch,
} from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { createApi } from '../../src/db/api'
import type {
  Category, Tag, TaskWithDetails,
  CreateTaskInput, UpdateTaskInput, Recurrence,
} from '@taskflow/shared'
import { RECURRENCE_TYPE_LABELS, PRIORITY_COLORS } from '@taskflow/shared'

const PRIORITIES = ['low', 'medium', 'high'] as const
const SCHEDULE_TYPES = [
  { label: 'Any day',  value: 'any'     },
  { label: 'Weekdays', value: 'weekday' },
  { label: 'Weekends', value: 'weekend' },
] as const
const RECURRENCE_TYPES = ['daily', 'weekly', 'monthly', 'yearly', 'hourly', 'custom'] as const
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function TaskFormModal() {
  const db     = useSQLiteContext()
  const api    = createApi(db)
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEdit = Boolean(id)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(isEdit)
  const [saving,     setSaving]     = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [allTags,    setAllTags]    = useState<Tag[]>([])

  const [title,        setTitle]       = useState('')
  const [description,  setDescription] = useState('')
  const [categoryId,   setCategoryId]  = useState<number | null>(null)
  const [priority,     setPriority]    = useState<'low' | 'medium' | 'high'>('medium')
  const [dueDate,      setDueDate]     = useState('')
  const [dueTime,      setDueTime]     = useState('')
  const [scheduleType, setScheduleType] = useState<'any' | 'weekday' | 'weekend'>('any')
  const [tagIds,       setTagIds]      = useState<number[]>([])

  const [hasRecurrence,    setHasRecurrence]    = useState(false)
  const [recurrenceType,   setRecurrenceType]   = useState<Recurrence['type']>('daily')
  const [recInterval,      setRecInterval]      = useState('1')
  const [recDaysOfWeek,    setRecDaysOfWeek]    = useState<number[]>([])
  const [recDayOfMonth,    setRecDayOfMonth]    = useState('')
  const [recEndsOn,        setRecEndsOn]        = useState('')
  const [recEndsAfter,     setRecEndsAfter]     = useState('')

  // Subtask creation (quick add inline)
  const [newSubtask,   setNewSubtask]  = useState('')
  const [subtasks,     setSubtasks]    = useState<{ id?: number; title: string; completed: boolean }[]>([])

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const [cats, tags] = await Promise.all([
        api.categories.getAll(),
        api.tags.getAll(),
      ])
      setCategories(cats)
      setAllTags(tags)

      if (isEdit && id) {
        const task = await api.tasks.getById(Number(id)) as TaskWithDetails | undefined
        if (task) {
          setTitle(task.title)
          setDescription(task.description ?? '')
          setCategoryId(task.category_id)
          setPriority(task.priority)
          setDueDate(task.due_date ?? '')
          setDueTime(task.due_time ?? '')
          setScheduleType(task.schedule_type)
          setTagIds((task.tags ?? []).map(t => t.id))

          if (task.recurrence) {
            setHasRecurrence(true)
            setRecurrenceType(task.recurrence.type)
            setRecInterval(String(task.recurrence.interval))
            setRecDaysOfWeek(
              task.recurrence.days_of_week
                ? task.recurrence.days_of_week.split(',').map(Number)
                : []
            )
            setRecDayOfMonth(String(task.recurrence.day_of_month ?? ''))
            setRecEndsOn(task.recurrence.ends_on ?? '')
            setRecEndsAfter(String(task.recurrence.ends_after ?? ''))
          }

          // Load subtasks
          const subs = await api.subtasks.getForTask(task.id)
          setSubtasks(subs.map(s => ({ id: s.id, title: s.title, completed: s.completed })))
        }
      }

      setLoading(false)
    }
    init()
  }, [])

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Task title is required.')
      return
    }
    setSaving(true)
    try {
      let recurrence: Omit<Recurrence, 'id'> | undefined
      if (hasRecurrence) {
        recurrence = {
          type:          recurrenceType,
          interval:      Math.max(1, parseInt(recInterval, 10) || 1),
          days_of_week:  recDaysOfWeek.length > 0 ? recDaysOfWeek.join(',') : null,
          day_of_month:  recDayOfMonth ? parseInt(recDayOfMonth, 10) : null,
          month_of_year: null,
          custom_cron:   null,
          ends_on:       recEndsOn || null,
          ends_after:    recEndsAfter ? parseInt(recEndsAfter, 10) : null,
        }
      }

      const payload = {
        title:        title.trim(),
        description:  description.trim() || null,
        category_id:  categoryId,
        priority,
        due_date:     dueDate || null,
        due_time:     dueTime || null,
        recurrence_id: null,
        schedule_type: scheduleType,
        status:        'active' as const,
        sort_order:    0,
        recurrence:    recurrence ?? (isEdit ? null : undefined),
      }

      let taskId: number
      if (isEdit && id) {
        const updated = await api.tasks.update(Number(id), payload as UpdateTaskInput)
        taskId = Number(id)
        if (!updated) throw new Error('Update failed')
      } else {
        const created = await api.tasks.create(payload as CreateTaskInput)
        taskId = created.id
      }

      // Update tags
      await api.tags.setTaskTags(taskId, tagIds)

      // Add any new subtasks
      for (const st of subtasks.filter(s => !s.id)) {
        await api.subtasks.create(taskId, st.title)
      }

      router.back()
    } catch (e) {
      Alert.alert('Save failed', String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete Task', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.tasks.delete(Number(id))
          router.back()
        },
      },
    ])
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Title */}
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="What needs to be done?"
        placeholderTextColor="#94a3b8"
        returnKeyType="next"
        autoFocus={!isEdit}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional notes…"
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={3}
      />

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <Pressable
          style={[styles.chip, categoryId === null && styles.chipActive]}
          onPress={() => setCategoryId(null)}
        >
          <Text style={[styles.chipText, categoryId === null && styles.chipTextActive]}>None</Text>
        </Pressable>
        {categories.map(cat => (
          <Pressable
            key={cat.id}
            style={[styles.chip, categoryId === cat.id && styles.chipActive]}
            onPress={() => setCategoryId(cat.id)}
          >
            <Text style={styles.chipEmoji}>{cat.icon}</Text>
            <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>
              {cat.name.split(' / ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Priority */}
      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {PRIORITIES.map(p => (
          <Pressable
            key={p}
            style={[
              styles.priorityBtn,
              priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] },
            ]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.priorityText, priority === p && { color: '#fff' }]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Schedule type */}
      <Text style={styles.label}>Schedule</Text>
      <View style={styles.row}>
        {SCHEDULE_TYPES.map(s => (
          <Pressable
            key={s.value}
            style={[styles.schedBtn, scheduleType === s.value && styles.schedBtnActive]}
            onPress={() => setScheduleType(s.value)}
          >
            <Text style={[styles.schedText, scheduleType === s.value && styles.schedTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Due date / time */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2025-12-31"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={dueTime}
            onChangeText={setDueTime}
            placeholder="09:00"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Recurrence toggle */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Recurring Task</Text>
        <Switch
          value={hasRecurrence}
          onValueChange={setHasRecurrence}
          trackColor={{ false: '#e2e8f0', true: '#a5b4fc' }}
          thumbColor={hasRecurrence ? '#6366f1' : '#94a3b8'}
        />
      </View>

      {hasRecurrence && (
        <View style={styles.recurrenceBox}>
          {/* Type */}
          <Text style={styles.label}>Recurrence Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {RECURRENCE_TYPES.map(rt => (
              <Pressable
                key={rt}
                style={[styles.chip, recurrenceType === rt && styles.chipActive]}
                onPress={() => setRecurrenceType(rt)}
              >
                <Text style={[styles.chipText, recurrenceType === rt && styles.chipTextActive]}>
                  {RECURRENCE_TYPE_LABELS[rt]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Interval */}
          <Text style={styles.label}>Every N occurrences</Text>
          <TextInput
            style={[styles.input, { width: 80 }]}
            value={recInterval}
            onChangeText={setRecInterval}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor="#94a3b8"
          />

          {/* Days of week (for weekly) */}
          {recurrenceType === 'weekly' && (
            <>
              <Text style={styles.label}>Days of Week</Text>
              <View style={styles.row}>
                {DAYS.map((d, i) => (
                  <Pressable
                    key={i}
                    style={[styles.dayBtn, recDaysOfWeek.includes(i) && styles.dayBtnActive]}
                    onPress={() =>
                      setRecDaysOfWeek(prev =>
                        prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                      )
                    }
                  >
                    <Text style={[styles.dayBtnText, recDaysOfWeek.includes(i) && { color: '#fff' }]}>
                      {d[0]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Day of month (monthly) */}
          {(recurrenceType === 'monthly' || recurrenceType === 'yearly') && (
            <>
              <Text style={styles.label}>Day of Month (1-31)</Text>
              <TextInput
                style={[styles.input, { width: 80 }]}
                value={recDayOfMonth}
                onChangeText={setRecDayOfMonth}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor="#94a3b8"
              />
            </>
          )}

          {/* End conditions */}
          <Text style={styles.label}>Ends on (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={recEndsOn}
            onChangeText={setRecEndsOn}
            placeholder="Leave blank for no end"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />
          <Text style={styles.label}>Or ends after N occurrences</Text>
          <TextInput
            style={[styles.input, { width: 80 }]}
            value={recEndsAfter}
            onChangeText={setRecEndsAfter}
            keyboardType="numeric"
            placeholder="—"
            placeholderTextColor="#94a3b8"
          />
        </View>
      )}

      {/* Tags */}
      <Text style={styles.label}>Tags</Text>
      {allTags.length === 0 ? (
        <Text style={styles.hint}>No tags yet — create them in Settings.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {allTags.map(tag => (
            <Pressable
              key={tag.id}
              style={[styles.chip, tagIds.includes(tag.id) && { backgroundColor: tag.color, borderColor: tag.color }]}
              onPress={() =>
                setTagIds(prev =>
                  prev.includes(tag.id) ? prev.filter(x => x !== tag.id) : [...prev, tag.id]
                )
              }
            >
              <Text style={[styles.chipText, tagIds.includes(tag.id) && { color: '#fff' }]}>
                #{tag.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Subtasks */}
      <Text style={styles.label}>Subtasks</Text>
      {subtasks.map((st, i) => (
        <View key={i} style={styles.subtaskRow}>
          <Ionicons
            name={st.completed ? 'checkbox' : 'square-outline'}
            size={20}
            color={st.completed ? '#22c55e' : '#94a3b8'}
          />
          <Text style={[styles.subtaskText, st.completed && styles.subtaskDone]}>{st.title}</Text>
          <Pressable onPress={() => setSubtasks(prev => prev.filter((_, j) => j !== i))}>
            <Ionicons name="close" size={16} color="#94a3b8" />
          </Pressable>
        </View>
      ))}
      <View style={styles.subtaskAdd}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          value={newSubtask}
          onChangeText={setNewSubtask}
          placeholder="Add subtask…"
          placeholderTextColor="#94a3b8"
          returnKeyType="done"
          onSubmitEditing={() => {
            if (newSubtask.trim()) {
              setSubtasks(prev => [...prev, { title: newSubtask.trim(), completed: false }])
              setNewSubtask('')
            }
          }}
        />
        <Pressable
          style={styles.subtaskAddBtn}
          onPress={() => {
            if (newSubtask.trim()) {
              setSubtasks(prev => [...prev, { title: newSubtask.trim(), completed: false }])
              setNewSubtask('')
            }
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Create Task'}</Text>
          }
        </Pressable>

        {isEdit && (
          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
            <Text style={styles.deleteBtnText}>Delete Task</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f8fafc' },
  content:         { padding: 20, paddingBottom: 60 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label:           { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 14 },
  hint:            { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#1e293b', marginBottom: 2,
  },
  multiline:       { minHeight: 72, textAlignVertical: 'top' },
  chips:           { maxHeight: 44, marginBottom: 4 },
  chip:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                     paddingVertical: 8, backgroundColor: '#f1f5f9', borderRadius: 20,
                     marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive:      { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText:        { fontSize: 12, color: '#64748b', fontWeight: '600' },
  chipTextActive:  { color: '#fff' },
  chipEmoji:       { fontSize: 13, marginRight: 4 },
  row:             { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  priorityBtn:     { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
                     borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  priorityText:    { fontSize: 13, fontWeight: '600', color: '#475569' },
  schedBtn:        { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
                     borderColor: '#e2e8f0', backgroundColor: '#f8fafc', alignItems: 'center' },
  schedBtnActive:  { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  schedText:       { fontSize: 12, fontWeight: '600', color: '#475569' },
  schedTextActive: { color: '#fff' },
  switchRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  recurrenceBox:   { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14, marginTop: 4 },
  dayBtn:          { width: 36, height: 36, borderRadius: 18, justifyContent: 'center',
                     alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  dayBtnActive:    { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  dayBtnText:      { fontSize: 12, fontWeight: '700', color: '#475569' },
  subtaskRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
                     borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  subtaskText:     { flex: 1, fontSize: 14, color: '#334155', marginLeft: 8 },
  subtaskDone:     { textDecorationLine: 'line-through', color: '#94a3b8' },
  subtaskAdd:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  subtaskAddBtn:   { width: 40, height: 40, borderRadius: 10, backgroundColor: '#6366f1',
                     justifyContent: 'center', alignItems: 'center' },
  actions:         { marginTop: 28 },
  saveBtn:         { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16,
                     alignItems: 'center' },
  saveBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled:        { opacity: 0.6 },
  deleteBtn:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                     marginTop: 12, paddingVertical: 12 },
  deleteBtnText:   { color: '#ef4444', fontSize: 15, fontWeight: '600' },
})
