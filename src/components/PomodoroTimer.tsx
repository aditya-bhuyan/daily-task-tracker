/**
 * PomodoroTimer — Feature 6
 * A per-task Pomodoro timer with work/short-break/long-break intervals.
 * Rendered as a compact popover on the task card.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

type Phase = 'work' | 'short' | 'long'

interface PomodoroConfig {
  work: number   // minutes
  short: number  // minutes
  long: number   // minutes
  rounds: number // work rounds before long break
}

const DEFAULT_CONFIG: PomodoroConfig = { work: 25, short: 5, long: 15, rounds: 4 }

interface PomodoroProps {
  taskTitle: string
  onComplete?: () => void
}

const PHASE_LABELS: Record<Phase, string> = {
  work: '🍅 Focus',
  short: '☕ Short Break',
  long: '🛋 Long Break',
}

const PHASE_COLORS: Record<Phase, string> = {
  work:  'text-red-500 dark:text-red-400',
  short: 'text-green-500 dark:text-green-400',
  long:  'text-blue-500 dark:text-blue-400',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── Ring component ───────────────────────────────────────────────────────────

function TimerRing({ progress, phase }: { progress: number; phase: Phase }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const ringColors: Record<Phase, string> = { work: '#ef4444', short: '#22c55e', long: '#3b82f6' }
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28">
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={ringColors[phase]}
        strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PomodoroTimer({ taskTitle, onComplete }: PomodoroProps) {
  const cfg = DEFAULT_CONFIG
  const [phase, setPhase] = useState<Phase>('work')
  const [round, setRound] = useState(1)
  const [remaining, setRemaining] = useState(cfg.work * 60)
  const [running, setRunning] = useState(false)
  const [completedRounds, setCompletedRounds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalForPhase = useCallback((p: Phase) => {
    if (p === 'work')  return cfg.work * 60
    if (p === 'short') return cfg.short * 60
    return cfg.long * 60
  }, [cfg])

  // Auto-advance phase on timer completion
  useEffect(() => {
    if (remaining > 0) return
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    setRunning(false)

    // Play a simple beep via AudioContext if available
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.start(); osc.stop(ctx.currentTime + 0.8)
    } catch { /* no audio */ }

    if (phase === 'work') {
      const newCompleted = completedRounds + 1
      setCompletedRounds(newCompleted)
      if (onComplete) onComplete()
      if (newCompleted % cfg.rounds === 0) {
        setPhase('long'); setRemaining(cfg.long * 60); setRound(r => r + 1)
      } else {
        setPhase('short'); setRemaining(cfg.short * 60)
      }
    } else {
      setPhase('work'); setRemaining(cfg.work * 60)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current); intervalRef.current = null
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  // Update page title while running
  useEffect(() => {
    if (running) {
      document.title = `${formatTime(remaining)} ${PHASE_LABELS[phase]} — ${taskTitle}`
    } else {
      document.title = 'TaskFlow'
    }
    return () => { document.title = 'TaskFlow' }
  }, [running, remaining, phase, taskTitle])

  function skip() {
    setRunning(false)
    if (phase === 'work') {
      setPhase('short'); setRemaining(cfg.short * 60)
    } else {
      setPhase('work'); setRemaining(cfg.work * 60)
    }
  }

  function reset() {
    setRunning(false); setPhase('work'); setRound(1)
    setRemaining(cfg.work * 60); setCompletedRounds(0)
  }

  const total = totalForPhase(phase)
  const progress = remaining / total

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-3">
      {/* Task name */}
      <p className="text-xs text-center text-muted-foreground max-w-[180px] truncate" title={taskTitle}>
        {taskTitle}
      </p>

      {/* Phase label */}
      <p className={`text-xs font-semibold uppercase tracking-wide ${PHASE_COLORS[phase]}`}>
        {PHASE_LABELS[phase]} · Round {round}
      </p>

      {/* Ring + time overlay */}
      <div className="relative flex items-center justify-center">
        <TimerRing progress={progress} phase={phase} />
        <span className="absolute text-xl font-mono font-bold tabular-nums">{formatTime(remaining)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={running ? 'outline' : 'default'}
          className="h-8 w-20 text-xs"
          onClick={() => setRunning(r => !r)}
        >
          {running ? '⏸ Pause' : '▶ Start'}
        </Button>
        <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={skip} title="Skip to next phase">⏭</Button>
        <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-muted-foreground" onClick={reset} title="Reset">↺</Button>
      </div>

      {/* Rounds indicator */}
      <div className="flex items-center gap-1">
        {Array.from({ length: cfg.rounds }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-4 rounded-full transition-colors ${i < (completedRounds % cfg.rounds) ? 'bg-red-500' : 'bg-muted'}`}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{completedRounds} round{completedRounds !== 1 ? 's' : ''} completed</p>
    </div>
  )
}
