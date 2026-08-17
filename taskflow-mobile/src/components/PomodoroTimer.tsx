/**
 * @file src/components/PomodoroTimer.tsx
 * @description Pomodoro timer widget with 25/5 min work-break cycles.
 *              Uses Animated API for the ring; expo-haptics for vibration.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, Pressable, Animated, StyleSheet,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'

const WORK_SECONDS  = 25 * 60
const BREAK_SECONDS = 5  * 60

type Phase = 'work' | 'break' | 'idle'

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function PomodoroTimer() {
  const [phase,      setPhase]      = useState<Phase>('idle')
  const [remaining,  setRemaining]  = useState(WORK_SECONDS)
  const [pomodoroNo, setPomodoroNo] = useState(0)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const progress     = useRef(new Animated.Value(0)).current

  const total = phase === 'break' ? BREAK_SECONDS : WORK_SECONDS

  const start = () => {
    setPhase(p => p === 'idle' ? 'work' : p)
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          // Cycle complete
          clearInterval(intervalRef.current!)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
          setPhase(ph => {
            if (ph === 'work') {
              setPomodoroNo(n => n + 1)
              setRemaining(BREAK_SECONDS)
              return 'break'
            } else {
              setRemaining(WORK_SECONDS)
              return 'idle'
            }
          })
          return 0
        }
        return r - 1
      })
    }, 1000)
  }

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('idle')
    setRemaining(WORK_SECONDS)
    progress.setValue(0)
  }

  useEffect(() => {
    const elapsed = total - remaining
    Animated.timing(progress, {
      toValue:         elapsed / total,
      duration:        400,
      useNativeDriver: false,
    }).start()
  }, [remaining, total])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const isRunning = intervalRef.current !== null && phase !== 'idle'
  const ringColor = phase === 'break' ? '#22c55e' : '#6366f1'

  const circumference = 2 * Math.PI * 38
  const strokeDashoffset = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: [circumference, 0],
  })

  return (
    <View style={styles.container}>
      <Text style={styles.phaseLabel}>
        {phase === 'idle' ? '🍅 Pomodoro' : phase === 'work' ? '⚡ Focus' : '☕ Break'}
      </Text>

      {/* Timer ring */}
      <View style={styles.ringContainer}>
        <Text style={[styles.timeText, { color: ringColor }]}>{fmtTime(remaining)}</Text>
        <Text style={styles.subText}>
          {phase === 'idle' ? 'Ready' : phase === 'work' ? 'Work time' : 'Rest up'}
        </Text>
      </View>

      {/* Pomodoro count */}
      {pomodoroNo > 0 && (
        <Text style={styles.count}>
          {'🍅'.repeat(Math.min(pomodoroNo, 8))} {pomodoroNo} done
        </Text>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isRunning ? (
          <Pressable style={[styles.ctrlBtn, { backgroundColor: ringColor }]} onPress={start}>
            <Ionicons name="play" size={22} color="#fff" />
          </Pressable>
        ) : (
          <Pressable style={[styles.ctrlBtn, { backgroundColor: '#f59e0b' }]} onPress={pause}>
            <Ionicons name="pause" size={22} color="#fff" />
          </Pressable>
        )}
        <Pressable style={styles.resetBtn} onPress={reset}>
          <Ionicons name="refresh" size={22} color="#94a3b8" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  phaseLabel:   { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 16 },
  ringContainer:{ width: 120, height: 120, borderRadius: 60, borderWidth: 8,
                  borderColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center',
                  marginBottom: 12 },
  timeText:     { fontSize: 26, fontWeight: '800' },
  subText:      { fontSize: 11, color: '#94a3b8' },
  count:        { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  controls:     { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ctrlBtn:      { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  resetBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9',
                  justifyContent: 'center', alignItems: 'center' },
})
