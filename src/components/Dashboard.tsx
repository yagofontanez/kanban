import { useMemo } from 'react'
import clsx from 'clsx'
import { CalendarDays, AlertTriangle, History, Layers } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { ActivityEvent, Card, Project } from '@/types'
import {
  formatRelative,
  formatShortDate,
  isOverdue,
  labelStyles,
  priorityStyles,
} from './ui'

interface AggCard {
  projectId: string
  projectName: string
  projectEmoji: string
  columnId: string
  columnName: string
  card: Card
  project: Project
}

interface AggActivity {
  projectId: string
  projectName: string
  projectEmoji: string
  cardId: string
  cardTitle: string
  event: ActivityEvent
}

function todayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function Dashboard({ onOpenCard }: { onOpenCard: (projectId: string, cardId: string) => void }) {
  const projects = useStore((s) => s.projects)
  const projectOrder = useStore((s) => s.projectOrder)
  const setActiveProject = useStore((s) => s.setActiveProject)

  const { overdue, today, activity, totalCards, totalProjects } = useMemo(() => {
    const overdue: AggCard[] = []
    const today: AggCard[] = []
    const activity: AggActivity[] = []
    const isoToday = todayISO()
    let totalCards = 0

    for (const pid of projectOrder) {
      const p = projects[pid]
      if (!p) continue
      for (const colId of p.columnOrder) {
        const col = p.columns[colId]
        if (!col) continue
        for (const cid of col.cardIds) {
          const c = p.cards[cid]
          if (!c) continue
          totalCards++
          if (!c.dueDate) continue
          const entry: AggCard = {
            projectId: pid,
            projectName: p.name,
            projectEmoji: p.emoji,
            columnId: colId,
            columnName: col.name,
            card: c,
            project: p,
          }
          if (isOverdue(c.dueDate)) overdue.push(entry)
          else if (c.dueDate === isoToday) today.push(entry)
        }
      }
      for (const c of Object.values(p.cards)) {
        for (const ev of c.activity ?? []) {
          activity.push({
            projectId: pid,
            projectName: p.name,
            projectEmoji: p.emoji,
            cardId: c.id,
            cardTitle: c.title,
            event: ev,
          })
        }
      }
    }

    overdue.sort((a, b) => (a.card.dueDate ?? '').localeCompare(b.card.dueDate ?? ''))
    today.sort((a, b) => b.card.createdAt - a.card.createdAt)
    activity.sort((a, b) => b.event.createdAt - a.event.createdAt)

    return { overdue, today, activity: activity.slice(0, 20), totalCards, totalProjects: projectOrder.length }
  }, [projects, projectOrder])

  const handleOpen = (pid: string, cid: string) => {
    setActiveProject(pid)
    onOpenCard(pid, cid)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1040px] px-8 py-10">
        <header className="mb-8">
          <div className="serif text-4xl leading-tight text-ink">Bom retorno.</div>
          <div className="mt-1 text-[13.5px] text-ink-muted">
            Uma visão geral do que está acontecendo nos seus projetos.
          </div>
        </header>

        {/* Metric cards */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            icon={<Layers className="h-4 w-4" strokeWidth={2} />}
            label="Projetos"
            value={totalProjects.toString()}
          />
          <MetricCard
            icon={<Layers className="h-4 w-4" strokeWidth={2} />}
            label="Cards"
            value={totalCards.toString()}
          />
          <MetricCard
            icon={<AlertTriangle className="h-4 w-4" strokeWidth={2} />}
            label="Vencidos"
            value={overdue.length.toString()}
            tone={overdue.length > 0 ? 'danger' : 'default'}
          />
          <MetricCard
            icon={<CalendarDays className="h-4 w-4" strokeWidth={2} />}
            label="Para hoje"
            value={today.length.toString()}
            tone={today.length > 0 ? 'warn' : 'default'}
          />
        </section>

        <section className="mb-8">
          <SectionHeader
            icon={<AlertTriangle className="h-3.5 w-3.5 text-[#8F3248]" strokeWidth={2} />}
            title="Cards vencidos"
            count={overdue.length}
          />
          {overdue.length === 0 ? (
            <EmptyHint>Nada vencido. Bom trabalho.</EmptyHint>
          ) : (
            <CardList items={overdue} onOpen={handleOpen} emphasize="overdue" />
          )}
        </section>

        <section className="mb-8">
          <SectionHeader
            icon={<CalendarDays className="h-3.5 w-3.5 text-[#8A5D15]" strokeWidth={2} />}
            title="Para hoje"
            count={today.length}
          />
          {today.length === 0 ? (
            <EmptyHint>Nada marcado pra hoje.</EmptyHint>
          ) : (
            <CardList items={today} onOpen={handleOpen} />
          )}
        </section>

        <section>
          <SectionHeader
            icon={<History className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />}
            title="Atividade recente"
            count={activity.length}
          />
          {activity.length === 0 ? (
            <EmptyHint>Nenhuma atividade registrada ainda.</EmptyHint>
          ) : (
            <ul className="divide-y divide-edge/50 overflow-hidden rounded-xl border border-edge/70 bg-paper-raised">
              {activity.map((a, i) => (
                <li key={`${a.event.id}-${i}`}>
                  <button
                    onClick={() => handleOpen(a.projectId, a.cardId)}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-paper-sunken/60"
                  >
                    <span className="mt-0.5 text-base leading-none">{a.projectEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">{a.cardTitle}</div>
                      <div className="mt-0.5 text-2xs text-ink-soft">
                        {a.projectName} · {describeShort(a.event)} · {formatRelative(a.event.createdAt)}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function describeShort(ev: ActivityEvent): string {
  const d = ev.data ?? {}
  switch (ev.type) {
    case 'created': return 'criou o card'
    case 'title_changed': return 'renomeou'
    case 'description_changed': return 'atualizou descrição'
    case 'moved': return `moveu ${d.fromName ?? ''} → ${d.toName ?? ''}`
    case 'label_added': return `adicionou label ${d.labelName ?? ''}`
    case 'label_removed': return `removeu label ${d.labelName ?? ''}`
    case 'due_set': return 'definiu vencimento'
    case 'due_removed': return 'removeu vencimento'
    case 'priority_changed': return 'mudou prioridade'
    case 'checklist_added': return 'item de checklist'
    case 'checklist_toggled': return d.done ? 'concluiu item' : 'desmarcou item'
    case 'checklist_removed': return 'removeu item'
    case 'link_added': return 'adicionou link'
    case 'link_removed': return 'removeu link'
    case 'comment_added': return 'comentou'
    case 'pomodoro_completed': return `pomodoro +${d.durationMin ?? 25}min`
    default: return 'atualizou'
  }
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'default' | 'warn' | 'danger'
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border bg-paper-raised px-4 py-3 shadow-card',
        tone === 'danger' && 'border-[#E9BCC6]',
        tone === 'warn' && 'border-[#E6C98C]',
        (!tone || tone === 'default') && 'border-edge',
      )}
    >
      <div className="flex items-center gap-1.5 text-ink-muted">
        {icon}
        <span className="text-2xs font-semibold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <div className="mt-1 serif text-[32px] leading-none text-ink">{value}</div>
    </div>
  )
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      {icon}
      <span className="eyebrow">{title}</span>
      {count > 0 && <span className="text-2xs text-ink-soft">· {count}</span>}
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-edge px-4 py-5 text-center text-[12.5px] text-ink-muted">
      {children}
    </div>
  )
}

function CardList({
  items,
  onOpen,
  emphasize,
}: {
  items: AggCard[]
  onOpen: (pid: string, cid: string) => void
  emphasize?: 'overdue'
}) {
  return (
    <ul className="divide-y divide-edge/50 overflow-hidden rounded-xl border border-edge/70 bg-paper-raised">
      {items.map((it) => {
        const labels = (it.card.labelIds ?? [])
          .map((id) => it.project.labels[id])
          .filter(Boolean)
        const priority = it.card.priority ?? 'none'
        const ps = priorityStyles[priority]
        return (
          <li key={it.card.id}>
            <button
              onClick={() => onOpen(it.projectId, it.card.id)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-paper-sunken/60"
            >
              <span className="mt-0.5 text-base leading-none">{it.projectEmoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[13.5px] font-semibold text-ink">
                    {it.card.title}
                  </span>
                  {priority !== 'none' && (
                    <span className={clsx('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold', ps.bg, ps.text)}>
                      {ps.short}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-2xs text-ink-soft">
                  {it.projectName} · {it.columnName}
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
              </div>
              {it.card.dueDate && (
                <span
                  className={clsx(
                    'shrink-0 rounded px-2 py-1 text-[11px] font-semibold',
                    emphasize === 'overdue'
                      ? 'bg-[#F6CFD6] text-[#7A2438] ring-1 ring-inset ring-[#E5A3AF]'
                      : 'bg-paper-sunken text-ink-muted',
                  )}
                >
                  {formatShortDate(it.card.dueDate)}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
