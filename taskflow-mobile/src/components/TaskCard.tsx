/**
 * @file src/components/TaskCard.tsx
 * @description Reusable task card for React Native.
 *              Shows title, category, priority badge, recurrence tag,
 *              due time, subtask progress and completion actions.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useState } from 'react'
import {
  View, Text, Pressable, StyleSheet, Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { TaskWithDetails } from '@taskflow/shared'
import { PRIORITY_COLORS, RECURRENCE_TYPE_LABELS } from '@taskflow/shared'

interface Props {
  task: TaskWithDetails
  onPress?:    () => void
  onComplete?: () => void
  onDefer?:    () => void
  onSkip?:     () => void
  onUndo?:     () => void
}

export default function TaskCard({ task, onPress, onComplete, onDefer, onSkip, onUndo }: Props) {
  const [expanded, setExpanded] = useState(false)

  const status   = task.completion_today?.status
  const isDone   = status === 'completed'
  const isDeferred = status === 'deferred'
  const isSkipped  = status === 'skipped'
  const isActioned = isDone || isDeferred || isSkipped

  const priColor = PRIORITY_COLORS[task.priority] ?? '#94a3b8'

  const completedSubtasks = (task.subtasks ?? []).filter(s => s.completed).length
  const totalSubtasks     = (task.subtasks ?? []).length

  return (
    <Pressable
      style={[styles.card, isActioned && styles.cardActioned]}
      onPress={onPress}
      android_ripple={{ color: '#e0e7ff' }}
    >
      {/* Priority accent bar */}
      <View style={[styles.accentBar, { backgroundColor: priColor }]} />

      <View style={styles.body}>
        {/* Row 1: checkbox + title */}
        <View style={styles.titleRow}>
          <Pressable
            style={[styles.checkbox, isDone && styles.checkboxDone]}
            onPress={isDone ? onUndo : onComplete}
          >
            {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
          </Pressable>

          <Text
            style={[styles.title, isDone && styles.titleDone]}
            numberOfLines={expanded ? undefined : 2}
          >
            {task.title}
          </Text>

          <Pressable onPress={() => setExpanded(e => !e)} style={styles.expandBtn}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#94a3b8"
            />
          </Pressable>
        </View>

        {/* Chips row */}
        <View style={styles.chipsRow}>
          {task.category && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {task.category.icon} {task.category.name.split(' / ')[0]}
              </Text>
            </View>
          )}

          <View style={[styles.chip, { borderColor: priColor }]}>
            <Text style={[styles.chipText, { color: priColor }]}>
              {task.priority.toUpperCase()}
            </Text>
          </View>

          {task.recurrence && (
            <View style={[styles.chip, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
              <Ionicons name="repeat" size={10} color="#16a34a" style={{ marginRight: 3 }} />
              <Text style={[styles.chipText, { color: '#16a34a' }]}>
                {RECURRENCE_TYPE_LABELS[task.recurrence.type]}
              </Text>
            </View>
          )}

          {task.due_time && !isActioned && (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={10} color="#6366f1" style={{ marginRight: 2 }} />
              <Text style={[styles.chipText, { color: '#6366f1' }]}>{task.due_time}</Text>
            </View>
          )}

          {isDeferred && (
            <View style={[styles.chip, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
              <Text style={[styles.chipText, { color: '#d97706' }]}>
                ⏭ → {task.completion_today?.deferred_to}
              </Text>
            </View>
          )}

          {isSkipped && (
            <View style={[styles.chip, { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }]}>
              <Text style={[styles.chipText, { color: '#94a3b8' }]}>Skipped</Text>
            </View>
          )}
        </View>

        {/* Subtask progress */}
        {totalSubtasks > 0 && (
          <View style={styles.subtaskRow}>
            <View style={styles.subtaskBar}>
              <View
                style={[
                  styles.subtaskFill,
                  { width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.subtaskCount}>
              {completedSubtasks}/{totalSubtasks}
            </Text>
          </View>
        )}

        {/* Tags */}
        {(task.tags ?? []).length > 0 && (
          <View style={styles.tagsRow}>
            {task.tags!.map(tag => (
              <Text key={tag.id} style={[styles.tag, { color: tag.color }]}>
                #{tag.name}
              </Text>
            ))}
          </View>
        )}

        {/* Description (when expanded) */}
        {expanded && task.description && (
          <Text style={styles.description}>{task.description}</Text>
        )}

        {/* Action buttons (if not already actioned) */}
        {!isActioned && (onComplete || onDefer || onSkip) && (
          <View style={styles.actions}>
            {onComplete && (
              <Pressable style={[styles.actionBtn, styles.actionComplete]} onPress={onComplete}>
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Done</Text>
              </Pressable>
            )}
            {onDefer && (
              <Pressable style={[styles.actionBtn, styles.actionDefer]} onPress={onDefer}>
                <Ionicons name="calendar-outline" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Tomorrow</Text>
              </Pressable>
            )}
            {onSkip && (
              <Pressable style={[styles.actionBtn, styles.actionSkip]} onPress={onSkip}>
                <Ionicons name="play-skip-forward-outline" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Skip</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Undo button */}
        {isDone && onUndo && (
          <Pressable style={styles.undoBtn} onPress={onUndo}>
            <Ionicons name="arrow-undo-outline" size={14} color="#6366f1" />
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardActioned:   { opacity: 0.65 },
  accentBar:      { width: 4 },
  body:           { flex: 1, padding: 12 },
  titleRow:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center',
    marginRight: 10, marginTop: 1,
  },
  checkboxDone:   { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  title:          { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b', lineHeight: 21 },
  titleDone:      { textDecorationLine: 'line-through', color: '#94a3b8' },
  expandBtn:      { padding: 4 },
  chipsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: '#f8fafc', borderRadius: 20,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipText:       { fontSize: 10, fontWeight: '600', color: '#64748b' },
  subtaskRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  subtaskBar:     { flex: 1, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
  subtaskFill:    { height: 4, backgroundColor: '#22c55e', borderRadius: 2 },
  subtaskCount:   { fontSize: 10, color: '#94a3b8', marginLeft: 8 },
  tagsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag:            { fontSize: 10, fontWeight: '600' },
  description:    { fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 19 },
  actions:        { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, gap: 4,
  },
  actionComplete: { backgroundColor: '#22c55e' },
  actionDefer:    { backgroundColor: '#f59e0b' },
  actionSkip:     { backgroundColor: '#94a3b8' },
  actionBtnText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  undoBtn:        { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  undoText:       { color: '#6366f1', fontSize: 12, fontWeight: '600' },
})
