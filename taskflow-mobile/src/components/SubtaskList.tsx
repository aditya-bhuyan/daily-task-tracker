/**
 * @file src/components/SubtaskList.tsx
 * @description Inline subtask checklist component.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useState } from 'react'
import {
  View, Text, Pressable, TextInput, StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Subtask } from '@taskflow/shared'

interface Props {
  taskId:    number
  subtasks:  Subtask[]
  onToggle:  (id: number, completed: boolean) => void
  onAdd:     (title: string) => void
  onDelete:  (id: number) => void
}

export default function SubtaskList({ subtasks, onToggle, onAdd, onDelete }: Props) {
  const [newTitle, setNewTitle] = useState('')

  const done  = subtasks.filter(s => s.completed).length
  const total = subtasks.length

  return (
    <View style={styles.container}>
      {/* Header */}
      {total > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>Subtasks</Text>
          <Text style={styles.progress}>{done}/{total}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round((done / total) * 100)}%` }]} />
          </View>
        </View>
      )}

      {/* Items */}
      {subtasks.map(st => (
        <View key={st.id} style={styles.row}>
          <Pressable
            style={[styles.checkbox, st.completed && styles.checkboxDone]}
            onPress={() => onToggle(st.id, !st.completed)}
          >
            {st.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
          </Pressable>
          <Text style={[styles.title, st.completed && styles.titleDone]} numberOfLines={2}>
            {st.title}
          </Text>
          <Pressable onPress={() => onDelete(st.id)} style={styles.deleteBtn}>
            <Ionicons name="close" size={16} color="#cbd5e1" />
          </Pressable>
        </View>
      ))}

      {/* Add new */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add subtask…"
          placeholderTextColor="#94a3b8"
          value={newTitle}
          onChangeText={setNewTitle}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (newTitle.trim()) { onAdd(newTitle.trim()); setNewTitle('') }
          }}
        />
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            if (newTitle.trim()) { onAdd(newTitle.trim()); setNewTitle('') }
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { marginTop: 4 },
  header:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerText:   { fontSize: 12, fontWeight: '700', color: '#475569', flex: 1 },
  progress:     { fontSize: 11, color: '#94a3b8', marginRight: 8 },
  progressBar:  { width: 60, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#22c55e', borderRadius: 2 },
  row:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
                  borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  checkbox:     { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
                  borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center',
                  marginRight: 10 },
  checkboxDone: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  title:        { flex: 1, fontSize: 13, color: '#334155' },
  titleDone:    { textDecorationLine: 'line-through', color: '#94a3b8' },
  deleteBtn:    { padding: 4 },
  addRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  input: {
    flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#1e293b',
  },
  addBtn:       { width: 36, height: 36, borderRadius: 8, backgroundColor: '#6366f1',
                  justifyContent: 'center', alignItems: 'center' },
})
