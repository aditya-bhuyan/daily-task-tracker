/**
 * @file app/(tabs)/all-tasks.tsx
 * @description All Tasks view with search, filter by category/priority/schedule.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TextInput, Pressable,
  RefreshControl, ActivityIndicator, StyleSheet, ScrollView,
} from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { createApi } from '../../src/db/api'
import TaskCard from '../../src/components/TaskCard'
import type { TaskWithDetails, Category, TaskFilters } from '@taskflow/shared'

const PRIORITIES = [
  { label: 'All',    value: 'all'    },
  { label: 'High',   value: 'high'   },
  { label: 'Medium', value: 'medium' },
  { label: 'Low',    value: 'low'    },
]

const SCHEDULE_TYPES = [
  { label: 'All',      value: 'all'     },
  { label: 'Weekday',  value: 'weekday' },
  { label: 'Weekend',  value: 'weekend' },
]

export default function AllTasksScreen() {
  const db     = useSQLiteContext()
  const api    = createApi(db)
  const router = useRouter()

  const [tasks,       setTasks]      = useState<TaskWithDetails[]>([])
  const [categories,  setCategories] = useState<Category[]>([])
  const [loading,     setLoading]    = useState(true)
  const [refreshing,  setRefreshing] = useState(false)
  const [search,      setSearch]     = useState('')
  const [catFilter,   setCatFilter]  = useState<number | undefined>()
  const [priFilter,   setPriFilter]  = useState('all')
  const [schedFilter, setSchedFilter] = useState('all')

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else         setLoading(true)
    try {
      const filters: TaskFilters = {}
      if (search)             filters.search        = search
      if (catFilter)          filters.category_id   = catFilter
      if (priFilter !== 'all')   filters.priority      = priFilter
      if (schedFilter !== 'all') filters.schedule_type = schedFilter

      const [data, cats] = await Promise.all([
        api.tasks.getAll(filters),
        api.categories.getAll(),
      ])
      setTasks(data)
      setCategories(cats)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [db, search, catFilter, priFilter, schedFilter])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleComplete = async (task: TaskWithDetails) => {
    const date = new Date().toISOString().slice(0, 10)
    await api.completions.markComplete(task.id, date)
    load()
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks…"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={(v) => { setSearch(v); setTimeout(load, 300) }}
        />
        {search.length > 0 && (
          <Pressable onPress={() => { setSearch(''); setTimeout(load, 50) }}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <Pressable
          style={[styles.chip, catFilter === undefined && styles.chipActive]}
          onPress={() => { setCatFilter(undefined); setTimeout(load, 50) }}
        >
          <Text style={[styles.chipText, catFilter === undefined && styles.chipTextActive]}>All</Text>
        </Pressable>
        {categories.map(cat => (
          <Pressable
            key={cat.id}
            style={[styles.chip, catFilter === cat.id && styles.chipActive]}
            onPress={() => { setCatFilter(cat.id); setTimeout(load, 50) }}
          >
            <Text style={styles.chipEmoji}>{cat.icon}</Text>
            <Text style={[styles.chipText, catFilter === cat.id && styles.chipTextActive]}>
              {cat.name.split(' / ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Priority + schedule filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {PRIORITIES.map(p => (
          <Pressable
            key={p.value}
            style={[styles.chip, priFilter === p.value && styles.chipActive]}
            onPress={() => { setPriFilter(p.value); setTimeout(load, 50) }}
          >
            <Text style={[styles.chipText, priFilter === p.value && styles.chipTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
        <View style={styles.divider} />
        {SCHEDULE_TYPES.map(s => (
          <Pressable
            key={s.value}
            style={[styles.chip, schedFilter === s.value && styles.chipActive]}
            onPress={() => { setSchedFilter(s.value); setTimeout(load, 50) }}
          >
            <Text style={[styles.chipText, schedFilter === s.value && styles.chipTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultCount}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</Text>

      {/* Task list */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={() => handleComplete(item)}
            onPress={() =>
              router.push({ pathname: '/modal/task-form', params: { id: item.id } })
            }
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#6366f1']} />
        }
        contentContainerStyle={tasks.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <Ionicons name="search-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No tasks found</Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/modal/task-form')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f8fafc' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchRow:     { flexDirection: 'row', alignItems: 'center', margin: 12,
                   backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12,
                   borderWidth: 1, borderColor: '#e2e8f0' },
  searchIcon:    { marginRight: 8 },
  searchInput:   { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  chips:         { paddingLeft: 12, paddingBottom: 6, maxHeight: 44 },
  chip:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                   paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 20,
                   marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive:    { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText:      { fontSize: 12, color: '#64748b', fontWeight: '600' },
  chipTextActive:{ color: '#fff' },
  chipEmoji:     { fontSize: 13, marginRight: 4 },
  divider:       { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  resultCount:   { paddingHorizontal: 16, paddingBottom: 4, fontSize: 12, color: '#94a3b8' },
  list:          { paddingHorizontal: 16, paddingBottom: 100 },
  empty:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyInner:    { alignItems: 'center', paddingBottom: 60 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 12 },
  fab: {
    position: 'absolute', right: 20, bottom: 30,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
})
