import clsx from 'clsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, MessageSquare, AlignLeft, CheckSquare, Link as LinkIcon } from 'lucide-react'
import type { Card as CardT, Label } from '@/types'
import { useStore } from '@/store/useStore'
import { formatShortDate, isDueSoon, isOverdue, labelStyles, priorityStyles } from './ui'

interface Props {
  card: CardT
  columnId: string
  projectId: string
  onOpen: () => void
  dragging?: boolean
}

export function Card({ card, columnId, projectId, onOpen, dragging }: Props) {
  const labelsById = useStore((s) => s.projects[projectId]?.labels)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', columnId, cardId: card.id },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const labels: Label[] = (card.labelIds ?? [])
    .map((id) => labelsById?.[id])
    .filter((l): l is Label => Boolean(l))
  const overdue = isOverdue(card.dueDate)
  const soon = !overdue && isDueSoon(card.dueDate)

  const priority = card.priority ?? 'none'
  const pStyle = priorityStyles[priority]
  const checklist = card.checklist ?? []
  const checkDone = checklist.filter((i) => i.done).length
  const checkTotal = checklist.length
  const checkPct = checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0
  const links = card.links ?? []

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only open if it was a click, not a drag
        if (!isDragging) onOpen()
        e.stopPropagation()
      }}
      className={clsx(
        'group relative cursor-grab select-none rounded-lg border border-edge bg-paper-raised px-3 py-2.5 text-left shadow-card transition-all',
        'hover:-translate-y-[1px] hover:border-edge-strong hover:shadow-card-hover',
        'active:cursor-grabbing',
        (isDragging || dragging) && 'opacity-40',
      )}
    >
      {(priority !== 'none' || labels.length > 0) && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          {priority !== 'none' && (
            <span
              title={`Prioridade: ${pStyle.label}`}
              className={clsx(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-semibold',
                pStyle.bg,
                pStyle.text,
              )}
            >
              <span className={clsx('h-1.5 w-1.5 rounded-full', pStyle.dot)} />
              {pStyle.label}
            </span>
          )}
          {labels.map((l) => {
            const s = labelStyles[l.color]
            return (
              <span
                key={l.id}
                className={clsx(
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-medium',
                  s.bg,
                  s.text,
                )}
              >
                <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} />
                {l.name || 'sem título'}
              </span>
            )
          })}
        </div>
      )}

      <div className="text-[13.5px] font-medium leading-snug tracking-tightish text-ink">
        {card.title}
      </div>

      {checkTotal > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-2xs text-ink-muted">
            <span className="inline-flex items-center gap-1 font-medium">
              <CheckSquare className="h-3 w-3" strokeWidth={2} />
              {checkDone}/{checkTotal}
            </span>
            {checkDone === checkTotal && (
              <span className="font-medium text-[#386148]">completo</span>
            )}
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-paper-sunken">
            <div
              className={clsx(
                'h-full rounded-full transition-[width] duration-300',
                checkDone === checkTotal ? 'bg-label-sage' : 'bg-ink/60',
              )}
              style={{ width: `${checkPct}%` }}
            />
          </div>
        </div>
      )}

      {(card.description || card.dueDate || card.comments.length > 0 || links.length > 0) && (
        <div className="mt-2 flex items-center gap-3 text-2xs text-ink-muted">
          {card.description && (
            <span title="Tem descrição" className="inline-flex items-center gap-1">
              <AlignLeft className="h-3 w-3" strokeWidth={2} />
            </span>
          )}
          {links.length > 0 && (
            <span className="inline-flex items-center gap-1" title={`${links.length} link${links.length > 1 ? 's' : ''}`}>
              <LinkIcon className="h-3 w-3" strokeWidth={2} />
              {links.length}
            </span>
          )}
          {card.comments.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" strokeWidth={2} />
              {card.comments.length}
            </span>
          )}
          {card.dueDate && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold',
                overdue && 'bg-[#F6CFD6] text-[#7A2438] ring-1 ring-inset ring-[#E5A3AF]',
                soon && !overdue && 'bg-[#FAEEDB] text-[#8A5D15]',
                !overdue && !soon && 'text-ink-muted',
              )}
              title={overdue ? 'Vencido' : soon ? 'Vence em breve' : undefined}
            >
              <CalendarDays className="h-3 w-3" strokeWidth={2} />
              {formatShortDate(card.dueDate)}
              {overdue && <span className="text-[10px] font-bold">!</span>}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function CardPreview({ card, labels }: { card: CardT; labels: Label[] }) {
  return (
    <div className="dnd-overlay w-[268px] rounded-lg border border-edge-strong bg-paper-raised px-3 py-2.5 shadow-pop">
      {labels.length > 0 && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          {labels.map((l) => {
            const s = labelStyles[l.color]
            return (
              <span
                key={l.id}
                className={clsx('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-medium', s.bg, s.text)}
              >
                <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} />
                {l.name || 'sem título'}
              </span>
            )
          })}
        </div>
      )}
      <div className="text-[13.5px] font-medium leading-snug tracking-tightish text-ink">
        {card.title}
      </div>
    </div>
  )
}
