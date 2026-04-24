import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PomodoroPhase = 'idle' | 'work' | 'break' | 'paused'

const WORK_MIN = 25
const BREAK_MIN = 5

interface PomodoroState {
  phase: PomodoroPhase
  // phase before pause (so resume knows if it was work or break)
  resumeTo: Exclude<PomodoroPhase, 'idle' | 'paused'> | null
  // epoch ms when the current phase should end
  endsAt: number | null
  // remaining ms captured at pause time
  remainingAtPause: number | null
  // linked card context
  projectId: string | null
  cardId: string | null
  cardTitle: string
  // counter increments when a work cycle completes — listeners react to this
  completedTick: number
  // last completed work duration (minutes)
  lastCompletedMin: number

  startWork: (opts: { projectId: string; cardId: string; cardTitle: string; minutes?: number }) => void
  startBreak: (minutes?: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  tick: () => void
}

const now = () => Date.now()

export const usePomodoro = create<PomodoroState>()(
  persist(
    (set, get) => ({
      phase: 'idle',
      resumeTo: null,
      endsAt: null,
      remainingAtPause: null,
      projectId: null,
      cardId: null,
      cardTitle: '',
      completedTick: 0,
      lastCompletedMin: 0,

      startWork: ({ projectId, cardId, cardTitle, minutes = WORK_MIN }) => {
        set({
          phase: 'work',
          resumeTo: null,
          endsAt: now() + minutes * 60_000,
          remainingAtPause: null,
          projectId,
          cardId,
          cardTitle,
        })
      },

      startBreak: (minutes = BREAK_MIN) => {
        set({
          phase: 'break',
          resumeTo: null,
          endsAt: now() + minutes * 60_000,
          remainingAtPause: null,
        })
      },

      pause: () => {
        const s = get()
        if (s.phase !== 'work' && s.phase !== 'break') return
        const remaining = Math.max(0, (s.endsAt ?? now()) - now())
        set({
          phase: 'paused',
          resumeTo: s.phase,
          remainingAtPause: remaining,
          endsAt: null,
        })
      },

      resume: () => {
        const s = get()
        if (s.phase !== 'paused' || !s.resumeTo || s.remainingAtPause == null) return
        set({
          phase: s.resumeTo,
          endsAt: now() + s.remainingAtPause,
          remainingAtPause: null,
          resumeTo: null,
        })
      },

      stop: () => {
        set({
          phase: 'idle',
          resumeTo: null,
          endsAt: null,
          remainingAtPause: null,
          projectId: null,
          cardId: null,
          cardTitle: '',
        })
      },

      tick: () => {
        const s = get()
        if (s.phase === 'work' || s.phase === 'break') {
          if (s.endsAt && now() >= s.endsAt) {
            if (s.phase === 'work') {
              set({
                phase: 'break',
                endsAt: now() + BREAK_MIN * 60_000,
                completedTick: s.completedTick + 1,
                lastCompletedMin: WORK_MIN,
              })
            } else {
              set({
                phase: 'idle',
                endsAt: null,
                projectId: null,
                cardId: null,
                cardTitle: '',
              })
            }
          }
        }
      },
    }),
    {
      name: 'kanban.pomodoro.v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export const POMODORO_WORK_MIN = WORK_MIN
export const POMODORO_BREAK_MIN = BREAK_MIN
