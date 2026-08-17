/**
 * @file app/(tabs)/weekly.tsx
 * @description Weekly Review screen — completion rate, category/priority
 *              breakdown, and top task streaks.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useCallback, useState } from 'react'
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import { useFocusEffect } from 'expo-router'
import { createApi } from '../../src/db/api'
import type { WeeklyStats } from '@taskflow/shared'
import { PRIORITY_COLORS } from '@taskflow/shared'

export default function WeeklyScreen() {
  const db  = useSQLiteContext()
  const api = createApi(db)

  const [stats,      setStats]      = useState<WeeklyStats | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.analytics.getWeeklyStats(weekOffset)
      setStats(data)
    } finally {
      setLoading(false)
    }
  }, [db, weekOffset])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading || !stats) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>
  }

  const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Week navigation */}
      <View style={styles.weekNav}>
        <Pressable onPress={() => setWeekOffset(o => o - 1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹ Prev</Text>
        </Pressable>
        <View style={styles.weekLabel}>
          <Text style={styles.weekTitle}>
            {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)}w ago`}
          </Text>
          <Text style={styles.weekRange}>{fmt(stats.week_start)} – {fmt(stats.week_end)}</Text>
        </View>
        <Pressable
          onPress={() => setWeekOffset(o => Math.min(0, o + 1))}
          style={[styles.navBtn, weekOffset >= 0 && styles.navBtnDisabled]}
          disabled={weekOffset >= 0}
        >
          <Text style={[styles.navBtnText, weekOffset >= 0 && { color: '#cbd5e1' }]}>Next ›</Text>
        </Pressable>
      </View>

      {/* Donut ring summary */}
      <View style={styles.ringCard}>
        <View style={styles.ringCircle}>
          <Text style={styles.rateNumber}>{stats.completion_rate}%</Text>
          <Text style={styles.rateLabel}>Done</Text>
        </View>
        <View style={styles.ringStats}>
          <StatRow emoji="✅" label="Completed" value={stats.completed} color="#22c55e" />
          <StatRow emoji="⏭️" label="Skipped"   value={stats.skipped}   color="#94a3b8" />
          <StatRow emoji="📅" label="Deferred"  value={stats.deferred}  color="#f59e0b" />
          <StatRow emoji="📋" label="Total"     value={stats.total_scheduled} color="#6366f1" />
        </View>
      </View>

      {/* By category */}
      {stats.by_category.length > 0 && (
        <SectionCard title="By Category">
          {stats.by_category.map((cat, i) => (
            <View key={i} style={styles.barRow}>
              <Text style={styles.barEmoji}>{cat.category_icon}</Text>
              <View style={styles.barInfo}>
                <Text style={styles.barLabel} numberOfLines={1}>{cat.category_name}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: cat.total > 0 ? `${Math.round((cat.completed / cat.total) * 100)}%` : '0%' },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.barCount}>{cat.completed}/{cat.total}</Text>
            </View>
          ))}
        </SectionCard>
      )}

      {/* By priority */}
      {stats.by_priority.length > 0 && (
        <SectionCard title="By Priority">
          {stats.by_priority.map((pri, i) => (
            <View key={i} style={styles.barRow}>
              <View style={[styles.priBadge, { backgroundColor: PRIORITY_COLORS[pri.priority] ?? '#94a3b8' }]}>
                <Text style={styles.priBadgeText}>{pri.priority.toUpperCase()[0]}</Text>
              </View>
              <View style={styles.barInfo}>
                <Text style={styles.barLabel}>{pri.priority.charAt(0).toUpperCase() + pri.priority.slice(1)}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: pri.total > 0 ? `${Math.round((pri.completed / pri.total) * 100)}%` : '0%',
                        backgroundColor: PRIORITY_COLORS[pri.priority] ?? '#6366f1',
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.barCount}>{pri.completed}/{pri.total}</Text>
            </View>
          ))}
        </SectionCard>
      )}

      {/* Top streaks */}
      {stats.top_streaks.length > 0 && (
        <SectionCard title="🔥 Top Streaks">
          {stats.top_streaks.map((s, i) => (
            <View key={s.task_id} style={styles.streakRow}>
              <Text style={styles.streakRank}>#{i + 1}</Text>
              <Text style={styles.streakTitle} numberOfLines={1}>{s.title}</Text>
              <Text style={styles.streakDays}>{s.streak}d 🔥</Text>
            </View>
          ))}
        </SectionCard>
      )}
    </ScrollView>
  )
}

function StatRow({ emoji, label, value, color }: { emoji: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f8fafc' },
  content:       { padding: 16, paddingBottom: 40 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  weekNav:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   marginBottom: 16 },
  navBtn:        { padding: 8 },
  navBtnDisabled:{ opacity: 0.4 },
  navBtnText:    { color: '#6366f1', fontSize: 15, fontWeight: '600' },
  weekLabel:     { alignItems: 'center' },
  weekTitle:     { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  weekRange:     { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  ringCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 20,
                   flexDirection: 'row', alignItems: 'center', marginBottom: 16,
                   shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  ringCircle:    { width: 100, height: 100, borderRadius: 50,
                   borderWidth: 10, borderColor: '#6366f1',
                   justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  rateNumber:    { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  rateLabel:     { fontSize: 11, color: '#94a3b8' },
  ringStats:     { flex: 1 },
  statRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statEmoji:     { fontSize: 14, marginRight: 6 },
  statLabel:     { flex: 1, fontSize: 13, color: '#475569' },
  statValue:     { fontSize: 15, fontWeight: '700' },
  sectionCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
                   shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  barRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barEmoji:      { fontSize: 20, width: 30 },
  barInfo:       { flex: 1, marginHorizontal: 8 },
  barLabel:      { fontSize: 12, color: '#475569', marginBottom: 3 },
  barTrack:      { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  barFill:       { height: 6, backgroundColor: '#6366f1', borderRadius: 3 },
  barCount:      { fontSize: 12, color: '#64748b', fontWeight: '600', width: 32, textAlign: 'right' },
  priBadge:      { width: 28, height: 28, borderRadius: 14, justifyContent: 'center',
                   alignItems: 'center' },
  priBadgeText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  streakRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
                   borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  streakRank:    { fontSize: 13, color: '#94a3b8', width: 28 },
  streakTitle:   { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '500' },
  streakDays:    { fontSize: 15, fontWeight: '700', color: '#f59e0b' },
})
