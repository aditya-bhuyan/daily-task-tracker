/**
 * @file app/(tabs)/heatmap.tsx
 * @description GitHub-style activity heatmap for the last 52 weeks.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useCallback, useState } from 'react'
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import { useFocusEffect } from 'expo-router'
import { createApi } from '../../src/db/api'
import type { HeatmapDay } from '@taskflow/shared'
import { HEATMAP_LEVELS, DAY_LABELS } from '@taskflow/shared'

const CELL = 13
const GAP  = 2
const WEEKS = 52

function heatColor(total: number): string {
  for (let i = HEATMAP_LEVELS.length - 1; i >= 0; i--) {
    if (total >= HEATMAP_LEVELS[i].min) return HEATMAP_LEVELS[i].color
  }
  return HEATMAP_LEVELS[0].color
}

export default function HeatmapScreen() {
  const db  = useSQLiteContext()
  const api = createApi(db)

  const [days,    setDays]    = useState<HeatmapDay[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.analytics.getHeatmapData(WEEKS * 7)
      setDays(data)
    } finally {
      setLoading(false)
    }
  }, [db])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>
  }

  // Build a date→day map
  const dayMap = new Map<string, HeatmapDay>()
  for (const d of days) dayMap.set(d.date, d)

  // Build grid: weeks columns × 7 rows (Sun–Sat)
  const today = new Date()
  const grid: string[][] = [] // grid[weekIdx][dayIdx] = ISO date

  for (let w = WEEKS - 1; w >= 0; w--) {
    const week: string[] = []
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today)
      date.setDate(today.getDate() - w * 7 - d)
      week.push(date.toISOString().slice(0, 10))
    }
    grid.push(week)
  }

  // Month labels: find which column a month starts on
  const monthLabels: { label: string; col: number }[] = []
  for (let w = 0; w < grid.length; w++) {
    const firstDay = new Date(grid[w][0])
    if (firstDay.getDate() <= 7) {
      monthLabels.push({
        label: firstDay.toLocaleString('default', { month: 'short' }),
        col:   w,
      })
    }
  }

  // Summary stats
  const totalCompleted = days.reduce((s, d) => s + d.completed, 0)
  const activeDays     = days.filter(d => d.total > 0).length
  const maxStreak = (() => {
    let best = 0, cur = 0
    for (let w = 0; w < grid.length; w++) {
      for (let d = 0; d < 7; d++) {
        const entry = dayMap.get(grid[w][d])
        if (entry && entry.completed > 0) { cur++; best = Math.max(best, cur) }
        else cur = 0
      }
    }
    return best
  })()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Activity Heatmap</Text>
      <Text style={styles.subheading}>Last 52 weeks</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatPill label="Total Done"  value={String(totalCompleted)} color="#22c55e" />
        <StatPill label="Active Days" value={String(activeDays)}     color="#6366f1" />
        <StatPill label="Best Streak" value={`${maxStreak}d`}        color="#f59e0b" />
      </View>

      {/* Heatmap grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Month labels */}
          <View style={styles.monthRow}>
            {monthLabels.map((m, i) => (
              <Text
                key={i}
                style={[styles.monthLabel, { left: m.col * (CELL + GAP) }]}
              >
                {m.label}
              </Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.gridOuter}>
            {/* Day-of-week labels */}
            <View style={styles.dayLabels}>
              {DAY_LABELS.map((d, i) => (
                <Text key={d} style={[styles.dayLabel, i % 2 === 0 ? {} : { opacity: 0 }]}>
                  {d[0]}
                </Text>
              ))}
            </View>

            {/* Columns (weeks) */}
            <View style={styles.gridInner}>
              {grid.map((week, wi) => (
                <View key={wi} style={styles.weekCol}>
                  {week.map((dateStr, di) => {
                    const entry  = dayMap.get(dateStr)
                    const isFut  = dateStr > today.toISOString().slice(0, 10)
                    return (
                      <View
                        key={di}
                        style={[
                          styles.cell,
                          { backgroundColor: isFut ? '#f1f5f9' : heatColor(entry?.total ?? 0) },
                        ]}
                      />
                    )
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendText}>Less</Text>
            {HEATMAP_LEVELS.map((l, i) => (
              <View key={i} style={[styles.legendCell, { backgroundColor: l.color }]} />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  )
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f8fafc' },
  content:     { padding: 20, paddingBottom: 40 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading:     { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  subheading:  { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  statsRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pill: {
    flex: 1, marginHorizontal: 4, backgroundColor: '#fff', borderRadius: 12,
    padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 4, elevation: 2,
  },
  pillValue:   { fontSize: 20, fontWeight: '800' },
  pillLabel:   { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  monthRow:    { height: 18, position: 'relative', marginLeft: 22, marginBottom: 2 },
  monthLabel:  { position: 'absolute', fontSize: 9, color: '#94a3b8' },
  gridOuter:   { flexDirection: 'row' },
  dayLabels:   { width: 18, justifyContent: 'space-around' },
  dayLabel:    { fontSize: 9, color: '#94a3b8', lineHeight: CELL + GAP },
  gridInner:   { flexDirection: 'row' },
  weekCol:     { marginRight: GAP },
  cell:        { width: CELL, height: CELL, borderRadius: 2, marginBottom: GAP },
  legend:      { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginLeft: 22 },
  legendText:  { fontSize: 10, color: '#94a3b8', marginHorizontal: 4 },
  legendCell:  { width: CELL, height: CELL, borderRadius: 2, marginRight: 2 },
})
