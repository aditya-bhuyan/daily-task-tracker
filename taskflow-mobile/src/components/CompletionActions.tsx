/**
 * @file src/components/CompletionActions.tsx
 * @description Bottom-sheet-style completion actions component.
 *              Done / Defer to date / Skip / Snooze / Undo.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useState } from 'react'
import {
  View, Text, Pressable, Modal, TextInput,
  StyleSheet, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { TaskWithDetails } from '@taskflow/shared'

interface Props {
  task:      TaskWithDetails
  visible:   boolean
  occDate:   string
  onDone:    (notes?: string) => void
  onDefer:   (deferTo: string) => void
  onSkip:    () => void
  onSnooze:  (minutes: number) => void
  onUndo:    () => void
  onClose:   () => void
}

const SNOOZE_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hrs',  value: 120 },
]

export default function CompletionActions({
  task, visible, onDone, onDefer, onSkip, onSnooze, onUndo, onClose,
}: Props) {
  const [notes,    setNotes]    = useState('')
  const [deferTo,  setDeferTo]  = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })

  const status = task.completion_today?.status
  const done   = status === 'completed'

  const tomorrow = () => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>

        {done ? (
          /* Already completed */
          <View style={styles.doneRow}>
            <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
            <Text style={styles.doneText}>Completed ✓</Text>
            <Pressable style={styles.undoBtn} onPress={() => { onUndo(); onClose() }}>
              <Ionicons name="arrow-undo-outline" size={16} color="#6366f1" />
              <Text style={styles.undoText}>Undo</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Notes input */}
            <TextInput
              style={styles.notes}
              placeholder="Notes (optional)…"
              placeholderTextColor="#94a3b8"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {/* Primary actions */}
            <View style={styles.row}>
              <Pressable
                style={[styles.btn, styles.btnDone]}
                onPress={() => { onDone(notes || undefined); onClose() }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.btnText}>Done</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.btnSkip]}
                onPress={() => { onSkip(); onClose() }}
              >
                <Ionicons name="play-skip-forward-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>Skip</Text>
              </Pressable>
            </View>

            {/* Defer */}
            <View style={styles.deferRow}>
              <Ionicons name="calendar-outline" size={18} color="#f59e0b" />
              <Text style={styles.deferLabel}>Defer to</Text>
              <TextInput
                style={styles.deferInput}
                value={deferTo}
                onChangeText={setDeferTo}
                placeholder={tomorrow()}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
              <Pressable
                style={styles.deferBtn}
                onPress={() => {
                  if (!deferTo) { Alert.alert('Enter a date'); return }
                  onDefer(deferTo); onClose()
                }}
              >
                <Text style={styles.deferBtnText}>Defer</Text>
              </Pressable>
            </View>

            {/* Snooze */}
            <Text style={styles.snoozeLabel}>Snooze reminder</Text>
            <View style={styles.snoozeRow}>
              {SNOOZE_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  style={styles.snoozeBtn}
                  onPress={() => { onSnooze(opt.value); onClose() }}
                >
                  <Text style={styles.snoozeBtnText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Close */}
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  handle:        { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2,
                   alignSelf: 'center', marginBottom: 16 },
  taskTitle:     { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 14 },
  doneRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  doneText:      { flex: 1, fontSize: 16, color: '#22c55e', fontWeight: '600' },
  undoBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  undoText:      { color: '#6366f1', fontSize: 13, fontWeight: '600' },
  notes: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 10, fontSize: 13, color: '#334155',
    minHeight: 60, textAlignVertical: 'top', marginBottom: 14,
  },
  row:           { flexDirection: 'row', gap: 12, marginBottom: 14 },
  btn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   paddingVertical: 14, borderRadius: 12, gap: 8 },
  btnDone:       { backgroundColor: '#22c55e' },
  btnSkip:       { backgroundColor: '#94a3b8' },
  btnText:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  deferRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  deferLabel:    { fontSize: 13, color: '#f59e0b', fontWeight: '600' },
  deferInput: {
    flex: 1, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: '#92400e',
  },
  deferBtn:      { backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  deferBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  snoozeLabel:   { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 8 },
  snoozeRow:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
  snoozeBtn:     { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9',
                   alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  snoozeBtnText: { fontSize: 12, fontWeight: '600', color: '#6366f1' },
  closeBtn:      { paddingVertical: 12, alignItems: 'center' },
  closeBtnText:  { fontSize: 14, color: '#94a3b8' },
})
