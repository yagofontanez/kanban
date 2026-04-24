import clsx from 'clsx'
import { Timer, Play, Pause, Square } from 'lucide-react'
import type { Card } from '@/types'
import { usePomodoro } from '@/store/usePomodoro'
import { formatDateTime } from './ui'

function fmtDuration(totalMin: number): string {
  if (totalMin < 60) return `${totalMin}min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

interface Props {
  projectId: string
  card: Card
}

export function PomodoroSection({ projectId, card }: Props) {
  const phase = usePomodoro((s) => s.phase)
  const linkedCardId = usePomodoro((s) => s.cardId)
  const startWork = usePomodoro((s) => s.startWork)
  const pause = usePomodoro((s) => s.pause)
  const resume = usePomodoro((s) => s.resume)
  const stop = usePomodoro((s) => s.stop)

  const linkedHere = linkedCardId === card.id
  const sessions = card.pomodoros ?? []
  const totalMin = sessions.reduce((acc, s) => acc + s.durationMin, 0)

  return (
    <div className="mt-8">
      <div className="mb-2 flex items-center gap-1.5">
        <Timer className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
        <span className="eyebrow">Pomodoro</span>
        {totalMin > 0 && (
          <span className="text-2xs text-ink-soft">
            · {fmtDuration(totalMin)} registrados · {sessions.length} sessão{sessions.length > 1 ? 'ões' : ''}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!linkedHere || phase === 'idle' ? (
          <button
            onClick={() =>
              startWork({ projectId, cardId: card.id, cardTitle: card.title })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-paper-raised px-3 py-1.5 text-[12.5px] font-semibold text-ink shadow-card transition-all hover:-translate-y-[1px] hover:border-edge-strong"
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2.4} />
            Iniciar Pomodoro (25min)
          </button>
        ) : (
          <>
            <span className={clsx(
              'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold',
              phase === 'break' ? 'bg-[#E3EFE7] text-[#386148]'
                : phase === 'paused' ? 'bg-paper-sunken text-ink-muted'
                  : 'bg-accent/10 text-accent-ink',
            )}>
              <Timer className="h-3.5 w-3.5" strokeWidth={2.2} />
              {phase === 'break' ? 'Pausa em andamento' : phase === 'paused' ? 'Pausado' : 'Focando neste card'}
            </span>
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
          </>
        )}
      </div>

      {sessions.length > 0 && (
        <ul className="mt-3 divide-y divide-edge/50 overflow-hidden rounded-lg border border-edge/70 bg-paper/50">
          {[...sessions].reverse().map((s) => (
            <li key={s.id} className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[12.5px] text-ink-muted">
                {formatDateTime(s.completedAt)}
              </span>
              <span className="text-[12.5px] font-medium text-ink">
                {s.durationMin}min
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
