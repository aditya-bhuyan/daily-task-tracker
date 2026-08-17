import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { useTasks } from '@/context/TaskContext'
import { useTheme } from '@/context/ThemeContext'
import { TaskCard } from '@/components/TaskCard'
import type { TaskWithDetails } from '@taskflow/shared'

/** Returns the ISO date string (YYYY-MM-DD) for any Date */
function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

/** Returns an array of 35 Date objects for a calendar grid (5 rows × 7 cols) */
function buildCalendarGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay() // 0 = Sun
  const grid: Date[] = []
  for (let i = -startDow; i < 35 - startDow; i++) {
    grid.push(new Date(year, month, 1 + i))
  }
  return grid
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export default function CalendarScreen() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(toISO(today))
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const { getTasksForDate } = useTasks()
  const { colors } = useTheme()

  const grid = buildCalendarGrid(year, month)

  useEffect(() => {
    getTasksForDate(selectedDate).then(setTasks)
  }, [selectedDate])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Month navigation */}
      <View style={[styles.navRow, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {MONTHS[month]} {year}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={[styles.dowRow, { backgroundColor: colors.surface }]}>
        {DAYS.map(d => (
          <Text key={d} style={[styles.dowLabel, { color: colors.muted }]}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {grid.map((d, i) => {
          const iso = toISO(d)
          const isCurrentMonth = d.getMonth() === month
          const isToday = iso === toISO(today)
          const isSelected = iso === selectedDate

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.cell,
                isSelected && { backgroundColor: colors.primary },
                isToday && !isSelected && { borderColor: colors.primary, borderWidth: 1 },
              ]}
              onPress={() => setSelectedDate(iso)}
            >
              <Text style={[
                styles.cellText,
                { color: isSelected ? '#fff' : isCurrentMonth ? colors.text : colors.muted },
              ]}>
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Tasks for selected date */}
      <FlatList
        data={tasks}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <TaskCard task={item} onChanged={() => getTasksForDate(selectedDate).then(setTasks)} />
        )}
        contentContainerStyle={styles.taskList}
        ListHeaderComponent={
          <Text style={[styles.dateHeader, { color: colors.muted }]}>
            Tasks for {selectedDate}
          </Text>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No tasks for this day
          </Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, fontWeight: '300' },
  monthLabel: { fontSize: 17, fontWeight: '600' },
  dowRow: { flexDirection: 'row', paddingBottom: 8 },
  dowLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  cellText: { fontSize: 14 },
  taskList: { padding: 12 },
  dateHeader: { fontSize: 13, marginBottom: 8 },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 14 },
})
