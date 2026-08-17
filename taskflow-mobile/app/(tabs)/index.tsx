import { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTasks } from '@/context/TaskContext'
import { useTheme } from '@/context/ThemeContext'
import { TaskCard } from '@/components/TaskCard'
import type { TaskWithDetails } from '@taskflow/shared'

export default function TodayScreen() {
  const { getTodayTasks, loading } = useTasks()
  const { colors } = useTheme()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function loadTasks() {
    const t = await getTodayTasks()
    setTasks(t)
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function onRefresh() {
    setRefreshing(true)
    await loadTasks()
    setRefreshing(false)
  }

  const completed = tasks.filter(t => t.completion_today?.status === 'completed').length

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header summary */}
      <View style={[styles.summary, { backgroundColor: colors.surface }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={[styles.summarySubtitle, { color: colors.muted }]}>
          {completed}/{tasks.length} tasks completed
        </Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <TaskCard task={item} onChanged={loadTasks} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No tasks scheduled for today</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Link href="/task/new" asChild>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  summaryTitle: { fontSize: 18, fontWeight: '600' },
  summarySubtitle: { fontSize: 13, marginTop: 2 },
  loader: { flex: 1 },
  list: { padding: 12 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 12 },
  emptyText: { fontSize: 15 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
})
