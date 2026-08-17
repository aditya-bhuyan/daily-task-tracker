/**
 * @file src/components/FilterBar.tsx
 * @description Reusable horizontal filter bar component.
 *              Shows category chips, priority selector and schedule-type toggle.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import type { Category, TaskFilters } from '@taskflow/shared'

interface Props {
  categories:  Category[]
  filters:     TaskFilters
  onChange:    (filters: TaskFilters) => void
}

const PRIORITIES     = [{ l: 'All', v: 'all' }, { l: '🔴 High', v: 'high' }, { l: '🟡 Med', v: 'medium' }, { l: '🟢 Low', v: 'low' }]
const SCHEDULE_TYPES = [{ l: 'Any', v: 'all' }, { l: 'Weekday', v: 'weekday' }, { l: 'Weekend', v: 'weekend' }]

export default function FilterBar({ categories, filters, onChange }: Props) {
  const upd = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch })

  return (
    <View style={styles.container}>
      {/* Category row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable
          style={[styles.chip, !filters.category_id && styles.active]}
          onPress={() => upd({ category_id: undefined })}
        >
          <Text style={[styles.chipText, !filters.category_id && styles.activeText]}>All</Text>
        </Pressable>
        {categories.map(cat => (
          <Pressable
            key={cat.id}
            style={[styles.chip, filters.category_id === cat.id && styles.active]}
            onPress={() => upd({ category_id: cat.id })}
          >
            <Text style={styles.emoji}>{cat.icon}</Text>
            <Text style={[styles.chipText, filters.category_id === cat.id && styles.activeText]}>
              {cat.name.split(' / ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Priority row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PRIORITIES.map(p => (
          <Pressable
            key={p.v}
            style={[styles.chip, (filters.priority ?? 'all') === p.v && styles.active]}
            onPress={() => upd({ priority: p.v === 'all' ? undefined : p.v })}
          >
            <Text style={[styles.chipText, (filters.priority ?? 'all') === p.v && styles.activeText]}>
              {p.l}
            </Text>
          </Pressable>
        ))}
        <View style={styles.sep} />
        {SCHEDULE_TYPES.map(s => (
          <Pressable
            key={s.v}
            style={[styles.chip, (filters.schedule_type ?? 'all') === s.v && styles.active]}
            onPress={() => upd({ schedule_type: s.v === 'all' ? undefined : s.v })}
          >
            <Text style={[styles.chipText, (filters.schedule_type ?? 'all') === s.v && styles.activeText]}>
              {s.l}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  row:       { paddingHorizontal: 12, paddingVertical: 6, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0',
  },
  active:    { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText:  { fontSize: 12, fontWeight: '600', color: '#64748b' },
  activeText:{ color: '#fff' },
  emoji:     { fontSize: 13, marginRight: 4 },
  sep:       { width: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
})
