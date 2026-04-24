import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Sun, AlertTriangle, ChevronDown, CalendarDays, ArrowRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Card, Project } from '@/types'
import {
  formatShortDate,
  isOverdue,
  labelStyles,
  priorityStyles,
} from './ui'
import { Popover, MenuItem } from './Popover'

interface Entry {
  projectId: string
  project: Project
  columnId: string
  columnName: string
  card: Card
}

function todayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function MyDay({ onOpenCard }: { onOpenCard: (projectId: string, cardId: string) => void }) {
  const projects = useStore((s) => s.projects)
  const projectOrder = useStore((s) => s.projectOrder)
  const setActiveProject = useStore((s) => s.setActiveProject)
  const moveCard = useStore((s) => s.moveCard)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const groups = useMemo(() => {
    const iso = todayISO()
    const byProject: Record<string, { project: Project; overdue: Entry[]; today: Entry[] }> = {}
    for (const pid of projectOrder) {
      const p = projects[pid]
      if (!p) continue
      for (const colId of p.columnOrder) {
        const col = p.columns[colId]
        if (!col) continue
        for (const cid of col.cardIds) {
          const c = p.cards[cid]
          if (!c || !c.dueDate) continue
          const entry: Entry = { projectId: pid, project: p, columnId: colId, columnName: col.name, card: c }
          if (isOverdue(c.dueDate)) {
            byProject[pid] ??= { project: p, overdue: [], today: [] }
            byProject[pid].overdue.push(entry)
          } else if (c.dueDate === iso) {
            byProject[pid] ??= { project: p, overdue: [], today: [] }
            byProject[pid].today.push(entry)
          }
        }
      }
      if (byProject[pid]) {
        byProject[pid].overdue.sort((a, b) => (a.card.dueDate ?? '').localeCompare(b.card.dueDate ?? ''))
        byProject[pid].today.sort((a, b) => b.card.createdAt - a.card.createdAt)
      }
    }
    return projectOrder
      .map((pid) => byProject[pid])
      .filter((x): x is NonNullable<typeof x> => !!x)
  }, [projects, projectOrder])

  const totalCount = groups.reduce((acc, g) => acc + g.overdue.length + g.today.length, 0)
  const totalOverdue = groups.reduce((acc, g) => acc + g.overdue.length, 0)

  const open = (e: Entry) => {
    setActiveProject(e.projectId)
    onOpenCard(e.projectId, e.card.id)
  }

  const handleMove = (e: Entry, targetColId: string) => {
    if (targetColId === e.columnId) return
    const destCol = e.project.columns[targetColId]
    if (!destCol) return
    moveCard(e.projectId, {
      activeCardId: e.card.id,
      sourceColId: e.columnId,
      destColId: targetColId,
      destIndex: destCol.cardIds.length,
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[960px] px-8 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-[#8A5D15]">
            <Sun className="h-5 w-5" strokeWidth={2} />
            <div className="eyebrow" style={{ color: '#8A5D15' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
          </div>
          <div className="serif mt-1 text-4xl leading-tight text-ink">Meu dia</div>
          <div className="mt-1 text-[13.5px] text-ink-muted">
            {totalCount === 0
              ? 'Nada com vencimento pra hoje ou em atraso. Respire fundo.'
              : `${totalCount} card${totalCount > 1 ? 's' : ''} pra atenção hoje${totalOverdue > 0 ? ` · ${totalOverdue} vencido${totalOverdue > 1 ? 's' : ''}` : ''}.`}
          </div>
        </header>

        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed border-edge px-6 py-10 text-center">
            <div className="serif mb-1 text-xl text-ink">Dia tranquilo.</div>
            <div className="text-[12.5px] text-ink-muted">
              Nenhum card vencido ou marcado pra hoje em nenhum projeto.
            </div>
          </div>
        )}

        <div className="space-y-6">
          {groups.map((g) => {
            const isCollapsed = collapsed[g.project.id]
            const count = g.overdue.length + g.today.length
            return (
              <section key={g.project.id} className="overflow-hidden rounded-xl border border-edge/70 bg-paper-raised">
                <button
                  onClick={() => setCollapsed((s) => ({ ...s, [g.project.id]: !s[g.project.id] }))}
                  className="flex w-full items-center justify-between gap-2 border-b border-edge/60 bg-paper-sunken/30 px-4 py-2.5 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{g.project.emoji}</span>
                    <span className="text-[13px] font-semibold tracking-tightish text-ink">{g.project.name}</span>
                    <span className="rounded bg-paper-raised px-1.5 py-0.5 text-2xs font-medium text-ink-muted shadow-inset">
                      {count}
                    </span>
                  </span>
                  <ChevronDown className={clsx('h-4 w-4 text-ink-muted transition-transform', isCollapsed && '-rotate-90')} />
                </button>

                {!isCollapsed && (
                  <ul className="divide-y divide-edge/50">
                    {g.overdue.map((e) => (
                      <EntryRow key={e.card.id} entry={e} emphasize="overdue" onOpen={open} onMove={handleMove} />
                    ))}
                    {g.today.map((e) => (
                      <EntryRow key={e.card.id} entry={e} onOpen={open} onMove={handleMove} />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EntryRow({
  entry,
  emphasize,
  onOpen,
  onMove,
}: {
  entry: Entry
  emphasize?: 'overdue'
  onOpen: (e: Entry) => void
  onMove: (e: Entry, targetColId: string) => void
}) {
  const labels = (entry.card.labelIds ?? [])
    .map((id) => entry.project.labels[id])
    .filter(Boolean)
  const priority = entry.card.priority ?? 'none'
  const ps = priorityStyles[priority]

  return (
    <li className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-paper-sunken/40">
      <button
        onClick={() => onOpen(entry)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          {emphasize === 'overdue' && (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#8F3248]" strokeWidth={2.2} />
          )}
          <span className="truncate text-[13.5px] font-semibold text-ink">{entry.card.title}</span>
          {priority !== 'none' && (
            <span className={clsx('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold', ps.bg, ps.text)}>
              {ps.short}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-2xs text-ink-soft">
          Coluna: <span className="font-medium text-ink-muted">{entry.columnName}</span>
        </div>
        {labels.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {labels.map((l) => {
              const s = labelStyles[l!.color]
              return (
                <span key={l!.id} className={clsx('rounded px-1.5 py-0.5 text-[10.5px] font-medium', s.bg, s.text)}>
                  {l!.name || 'sem título'}
                </span>
              )
            })}
          </div>
        )}
      </button>

      {entry.card.dueDate && (
        <span
          className={clsx(
            'shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold',
            emphasize === 'overdue'
              ? 'bg-[#F6CFD6] text-[#7A2438] ring-1 ring-inset ring-[#E5A3AF]'
              : 'bg-paper-sunken text-ink-muted',
          )}
        >
          <CalendarDays className="mr-0.5 -mt-0.5 inline h-3 w-3" strokeWidth={2} />
          {formatShortDate(entry.card.dueDate)}
        </span>
      )}

      <Popover
        align="right"
        trigger={({ toggle }) => (
          <button
            onClick={toggle}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-edge bg-paper-raised px-2 py-1 text-2xs font-medium text-ink-muted opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
            title="Mover para…"
          >
            Mover <ArrowRight className="h-3 w-3" />
          </button>
        )}
      >
        {({ close }) => (
          <div className="w-[220px] p-1">
            <div className="eyebrow px-2 py-1">Mover para</div>
            {entry.project.columnOrder.map((colId) => {
              const col = entry.project.columns[colId]
              if (!col) return null
              const active = colId === entry.columnId
              return (
                <MenuItem
                  key={colId}
                  onClick={() => {
                    onMove(entry, colId)
                    close()
                  }}
                >
                  <span className={clsx(active && 'text-ink-muted')}>
                    {col.name}
                    {active && <span className="ml-1 text-2xs text-ink-soft">(atual)</span>}
                  </span>
                </MenuItem>
              )
            })}
          </div>
        )}
      </Popover>
    </li>
  )
}
