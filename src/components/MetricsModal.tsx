import { useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import { X, BarChart3, Clock } from 'lucide-react'
import type { Project } from '@/types'

interface Props {
  project: Project
  onClose: () => void
}

function startOfWeek(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 (sun) .. 6 (sat)
  const diff = (day + 6) % 7 // days since monday
  d.setDate(d.getDate() - diff)
  return d.getTime()
}

function weekLabel(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export function MetricsModal({ project, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const lastCol = project.columnOrder[project.columnOrder.length - 1]
  const lastColName = lastCol ? project.columns[lastCol]?.name ?? '' : ''

  const { weeks, colTimings, totalShipped } = useMemo(() => {
    // Weekly: count cards moved INTO the last column per week (last 8 weeks)
    const weeksStart: number[] = []
    const now = Date.now()
    const thisWeek = startOfWeek(now)
    for (let i = 7; i >= 0; i--) {
      weeksStart.push(thisWeek - i * 7 * 24 * 3600 * 1000)
    }
    const perWeek = new Map<number, number>(weeksStart.map((w) => [w, 0]))

    // Avg time per column (based on move events)
    const colSums = new Map<string, { totalMs: number; count: number }>()

    for (const c of Object.values(project.cards)) {
      const events = c.activity ?? []
      // Sort by date ascending — activity is usually appended, but just be safe
      const sorted = [...events].sort((a, b) => a.createdAt - b.createdAt)

      // Weekly shipped: any move event with toName matching last column in last 8 weeks
      for (const ev of sorted) {
        if (ev.type === 'moved' && ev.data?.toName === lastColName) {
          const wk = startOfWeek(ev.createdAt)
          if (perWeek.has(wk)) perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1)
        }
      }

      // Column timings: pair each move event — card stays in fromName from previous move (or creation) to this move
      let segmentStart = c.createdAt
      let currentCol = project.columnOrder[0]
        ? project.columns[project.columnOrder[0]]?.name
        : undefined
      for (const ev of sorted) {
        if (ev.type === 'moved') {
          const fromName = ev.data?.fromName ?? currentCol
          if (fromName) {
            const s = colSums.get(fromName) ?? { totalMs: 0, count: 0 }
            s.totalMs += Math.max(0, ev.createdAt - segmentStart)
            s.count += 1
            colSums.set(fromName, s)
          }
          segmentStart = ev.createdAt
          currentCol = ev.data?.toName ?? currentCol
        }
      }
    }

    const weeks = weeksStart.map((w) => ({
      week: w,
      label: weekLabel(w),
      shipped: perWeek.get(w) ?? 0,
    }))

    // Column timings — go in project columnOrder order, show all columns
    const colTimings = project.columnOrder
      .map((colId) => {
        const col = project.columns[colId]
        if (!col) return null
        const s = colSums.get(col.name)
        const avgMs = s && s.count > 0 ? s.totalMs / s.count : 0
        return {
          name: col.name,
          avgHours: Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10,
          samples: s?.count ?? 0,
          color: col.color,
        }
      })
      .filter((x): x is NonNullable<typeof x> => !!x)

    const totalShipped = weeks.reduce((acc, w) => acc + w.shipped, 0)

    return { weeks, colTimings, totalShipped }
  }, [project, lastColName])

  const bottleneck = [...colTimings]
    .filter((c) => c.samples > 0)
    .sort((a, b) => b.avgHours - a.avgHours)[0]

  return (
    <div className="modal-open">
      <div className="backdrop fixed inset-0 z-40 animate-fade-in" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
        <div className="flex min-h-full items-start justify-center px-4 py-[5vh]">
          <div
            className="relative w-full max-w-[880px] animate-pop-in rounded-2xl border border-edge bg-paper-raised shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
              title="Fechar (Esc)"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-edge/70 px-8 py-6">
              <div className="eyebrow">Métricas</div>
              <div className="serif mt-1 text-[28px] leading-tight text-ink">{project.name}</div>
              <div className="mt-1 text-[12.5px] text-ink-muted">
                {totalShipped} card{totalShipped === 1 ? '' : 's'} concluídos nas últimas 8 semanas
                {lastColName && <> · coluna final: <span className="font-medium text-ink">{lastColName}</span></>}
                {bottleneck && (
                  <> · gargalo: <span className="font-medium text-ink">{bottleneck.name}</span> ({bottleneck.avgHours}h em média)</>
                )}
              </div>
            </div>

            <div className="grid gap-6 p-8 lg:grid-cols-1">
              <section>
                <div className="mb-2 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                  <span className="eyebrow">Velocity · cards concluídos por semana</span>
                </div>
                <div className="h-[220px] rounded-xl border border-edge/70 bg-paper/50 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeks} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#E9E6DD" strokeDasharray="2 4" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#9A9892', fontSize: 11 }}
                        axisLine={{ stroke: '#E9E6DD' }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#9A9892', fontSize: 11 }}
                        axisLine={{ stroke: '#E9E6DD' }}
                        tickLine={false}
                        width={28}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(30,30,28,0.04)' }}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E9E6DD',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: '#6B6B66' }}
                        formatter={(v: any) => [`${v} card${v === 1 ? '' : 's'}`, 'Concluídos']}
                      />
                      <Bar dataKey="shipped" fill="#B54A2C" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                  <span className="eyebrow">Tempo médio por coluna (horas)</span>
                </div>
                <div className="h-[220px] rounded-xl border border-edge/70 bg-paper/50 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={colTimings} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#E9E6DD" strokeDasharray="2 4" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#9A9892', fontSize: 11 }}
                        axisLine={{ stroke: '#E9E6DD' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#9A9892', fontSize: 11 }}
                        axisLine={{ stroke: '#E9E6DD' }}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(30,30,28,0.04)' }}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E9E6DD',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: '#6B6B66' }}
                        formatter={(v: any, _n: any, entry: any) => [
                          `${v}h · ${entry.payload.samples} amostra${entry.payload.samples === 1 ? '' : 's'}`,
                          'Tempo médio',
                        ]}
                      />
                      <Bar dataKey="avgHours" radius={[4, 4, 0, 0]}>
                        {colTimings.map((c, i) => {
                          const isBottleneck = bottleneck && c.name === bottleneck.name
                          return <Cell key={i} fill={isBottleneck ? '#C4526B' : '#636B73'} />
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {colTimings.every((c) => c.samples === 0) && (
                  <div className="mt-2 text-2xs text-ink-soft">
                    Ainda não há movimentações suficientes pra calcular tempos médios. Mova alguns cards entre colunas.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
