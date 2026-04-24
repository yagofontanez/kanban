import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Play, Pause, Square, Coffee, Timer } from 'lucide-react'
import { usePomodoro, POMODORO_WORK_MIN } from '@/store/usePomodoro'
import { useStore } from '@/store/useStore'

function fmt(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function PomodoroWidget() {
  const phase = usePomodoro((s) => s.phase)
  const endsAt = usePomodoro((s) => s.endsAt)
  const remainingAtPause = usePomodoro((s) => s.remainingAtPause)
  const cardTitle = usePomodoro((s) => s.cardTitle)
  const projectId = usePomodoro((s) => s.projectId)
  const cardId = usePomodoro((s) => s.cardId)
  const completedTick = usePomodoro((s) => s.completedTick)
  const lastCompletedMin = usePomodoro((s) => s.lastCompletedMin)
  const pause = usePomodoro((s) => s.pause)
  const resume = usePomodoro((s) => s.resume)
  const stop = usePomodoro((s) => s.stop)
  const tick = usePomodoro((s) => s.tick)

  const logPomodoroSession = useStore((s) => s.logPomodoroSession)
  const setActiveProject = useStore((s) => s.setActiveProject)

  const [, setNow] = useState(Date.now())

  useEffect(() => {
    if (phase === 'idle') return
    const id = setInterval(() => {
      tick()
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [phase, tick])

  // React to completed work cycles — record time on the card.
  useEffect(() => {
    if (completedTick === 0) return
    if (!projectId || !cardId || !lastCompletedMin) return
    logPomodoroSession(projectId, cardId, lastCompletedMin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedTick])

  if (phase === 'idle') return null

  const remaining =
    phase === 'paused'
      ? remainingAtPause ?? 0
      : Math.max(0, (endsAt ?? Date.now()) - Date.now())

  const total = (phase === 'break' ? 5 : POMODORO_WORK_MIN) * 60_000
  const progress = total > 0 ? 1 - remaining / total : 0

  const isWork = phase === 'work' || (phase === 'paused' && remainingAtPause !== null)
  const accentClass =
    phase === 'break'
      ? 'bg-[#386148]'
      : phase === 'paused'
        ? 'bg-ink-muted'
        : 'bg-accent'

  return (
    <div className="fixed bottom-4 right-4 z-[1500] w-[280px] animate-pop-in rounded-xl border border-edge bg-paper-raised p-3 shadow-pop"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="flex items-center gap-2">
        <span className={clsx('flex h-6 w-6 items-center justify-center rounded text-paper', accentClass)}>
          {phase === 'break' ? (
            <Coffee className="h-3.5 w-3.5" strokeWidth={2.4} />
          ) : (
            <Timer className="h-3.5 w-3.5" strokeWidth={2.4} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
            {phase === 'break' ? 'Pausa curta' : phase === 'paused' ? 'Pausado' : 'Foco'}
          </div>
          <button
            type="button"
            onClick={() => {
              if (projectId) setActiveProject(projectId)
            }}
            className="block w-full truncate text-left text-[12.5px] font-medium text-ink hover:text-accent-ink"
            title={cardTitle}
          >
            {cardTitle || '—'}
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-mono text-[26px] font-semibold tracking-tight text-ink">
          {fmt(remaining)}
        </span>
        <span className="text-2xs text-ink-soft">
          {isWork ? `${POMODORO_WORK_MIN}min` : '5min'}
        </span>
      </div>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-paper-sunken">
        <div
          className={clsx('h-full rounded-full transition-[width] duration-500', accentClass)}
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-1">
        {phase === 'paused' ? (
          <button
            onClick={resume}
            className="inline-flex items-center gap-1 rounded-md border border-edge bg-paper-raised px-2 py-1 text-2xs font-semibold text-ink hover:bg-paper-sunken"
          >
            <Play className="h-3 w-3" /> Retomar
          </button>
        ) : (
          <button
            onClick={pause}
            className="inline-flex items-center gap-1 rounded-md border border-edge bg-paper-raised px-2 py-1 text-2xs font-semibold text-ink hover:bg-paper-sunken"
          >
            <Pause className="h-3 w-3" /> Pausar
          </button>
        )}
        <button
          onClick={stop}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-ink-muted hover:bg-[#FBEAED] hover:text-[#8F3248]"
        >
          <Square className="h-3 w-3" /> Parar
        </button>
      </div>
    </div>
  )
}
