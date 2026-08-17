/**
 * @file app/(tabs)/export.tsx
 * @description CSV / JSON export screen with share sheet integration.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useCallback, useState } from 'react'
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  StyleSheet, Alert,
} from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import { useFocusEffect } from 'expo-router'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import { createApi } from '../../src/db/api'
import type { ExportRow, CompletionExportRow } from '@taskflow/shared'

type ExportFormat = 'csv' | 'json'
type ExportTarget = 'tasks' | 'completions'

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape  = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\r\n')
}

export default function ExportScreen() {
  const db  = useSQLiteContext()
  const api = createApi(db)

  const [tasks,       setTasks]       = useState<ExportRow[]>([])
  const [completions, setCompletions] = useState<CompletionExportRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [exporting,   setExporting]   = useState(false)
  const [format,      setFormat]      = useState<ExportFormat>('csv')
  const [target,      setTarget]      = useState<ExportTarget>('tasks')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, c] = await Promise.all([
        api.analytics.exportTasks(),
        api.analytics.exportCompletions(),
      ])
      setTasks(t)
      setCompletions(c)
    } finally {
      setLoading(false)
    }
  }, [db])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleExport = async () => {
    setExporting(true)
    try {
      const rows: Record<string, unknown>[] =
        (target === 'tasks' ? tasks : completions) as Record<string, unknown>[]

      let content: string
      let filename: string
      const ts = new Date().toISOString().slice(0, 10)

      if (format === 'json') {
        content  = JSON.stringify(rows, null, 2)
        filename = `taskflow-${target}-${ts}.json`
      } else {
        content  = rowsToCsv(rows)
        filename = `taskflow-${target}-${ts}.csv`
      }

      const uri = FileSystem.cacheDirectory + filename
      await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 })

      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: format === 'json' ? 'application/json' : 'text/csv' })
      } else {
        Alert.alert('Exported', `Saved to: ${uri}`)
      }
    } catch (e) {
      Alert.alert('Export failed', String(e))
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>
  }

  const previewRows = (target === 'tasks' ? tasks : completions).slice(0, 5) as Record<string, unknown>[]
  const count       = target === 'tasks' ? tasks.length : completions.length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Export Data</Text>
      <Text style={styles.sub}>Share your tasks and history as CSV or JSON.</Text>

      {/* Target selector */}
      <Text style={styles.label}>What to export</Text>
      <View style={styles.segRow}>
        {(['tasks', 'completions'] as ExportTarget[]).map(t => (
          <Pressable
            key={t}
            style={[styles.seg, target === t && styles.segActive]}
            onPress={() => setTarget(t)}
          >
            <Text style={[styles.segText, target === t && styles.segTextActive]}>
              {t === 'tasks' ? '📋 Tasks' : '✅ Completions'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Format selector */}
      <Text style={styles.label}>Format</Text>
      <View style={styles.segRow}>
        {(['csv', 'json'] as ExportFormat[]).map(f => (
          <Pressable
            key={f}
            style={[styles.seg, format === f && styles.segActive]}
            onPress={() => setFormat(f)}
          >
            <Text style={[styles.segText, format === f && styles.segTextActive]}>
              {f.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Ionicons name="document-text-outline" size={32} color="#6366f1" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.statsCount}>{count} rows</Text>
          <Text style={styles.statsSub}>
            {target === 'tasks' ? 'All tasks in database' : 'All completion records'}
          </Text>
        </View>
      </View>

      {/* Preview */}
      {previewRows.length > 0 && (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview (first {previewRows.length} rows)</Text>
          <ScrollView horizontal>
            <Text style={styles.previewText}>
              {format === 'json'
                ? JSON.stringify(previewRows, null, 2)
                : rowsToCsv(previewRows)}
            </Text>
          </ScrollView>
        </View>
      )}

      {/* Export button */}
      <Pressable
        style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
        onPress={handleExport}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="share-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.exportBtnText}>Export &amp; Share</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f8fafc' },
  content:         { padding: 20, paddingBottom: 40 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading:         { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  sub:             { fontSize: 13, color: '#94a3b8', marginBottom: 20, marginTop: 4 },
  label:           { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 16 },
  segRow:          { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 },
  seg:             { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segActive:       { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                     shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  segText:         { fontSize: 13, fontWeight: '600', color: '#64748b' },
  segTextActive:   { color: '#6366f1' },
  statsCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                     borderRadius: 14, padding: 16, marginTop: 20,
                     shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                     shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statsCount:      { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  statsSub:        { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  previewCard:     { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginTop: 16 },
  previewTitle:    { color: '#94a3b8', fontSize: 11, marginBottom: 8, fontWeight: '600' },
  previewText:     { fontFamily: 'monospace', fontSize: 10, color: '#e2e8f0' },
  exportBtn:       { flexDirection: 'row', backgroundColor: '#6366f1', borderRadius: 14,
                     paddingVertical: 16, justifyContent: 'center', alignItems: 'center',
                     marginTop: 24 },
  exportBtnDisabled: { opacity: 0.6 },
  exportBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
})
