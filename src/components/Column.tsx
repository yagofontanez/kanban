import { useState } from 'react'
import clsx from 'clsx'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Palette } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Column as ColumnT, ColumnColor } from '@/types'
import { Card } from './Card'
import { Popover, MenuItem, MenuDivider } from './Popover'
import { COLUMN_COLORS, COLUMN_COLOR_NAMES, columnStyles } from './ui'

interface Props {
  projectId: string
  column: ColumnT
  onOpenCard: (cardId: string) => void
}

export function Column({ projectId, column, onOpenCard }: Props) {
  const cards = useStore((s) => s.projects[projectId]?.cards)
  const renameColumn = useStore((s) => s.renameColumn)
  const deleteColumn = useStore((s) => s.deleteColumn)
  const createCard = useStore((s) => s.createCard)
  const setColumnColor = useStore((s) => s.setColumnColor)
  const color: ColumnColor = column.color ?? 'neutral'
  const cStyle = columnStyles[color]

  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(column.name)
  const [composing, setComposing] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  })

  // Dedicated droppable so we can drop a card on an empty column
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `col-droppable:${column.id}`,
    data: { type: 'column-droppable', columnId: column.id },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const commitRename = () => {
    renameColumn(projectId, column.id, renameValue)
    setRenaming(false)
  }

  const commitNewCard = () => {
    const t = newTitle.trim()
    if (t) createCard(projectId, column.id, t)
    setNewTitle('')
    setComposing(false)
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={clsx(
        'flex h-full w-[300px] shrink-0 flex-col rounded-xl',
        cStyle.surface,
        isDragging && 'opacity-50',
      )}
    >
      {/* Header — entire bar is the drag handle (pointer sensor keeps clicks intact) */}
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center gap-2 px-3 pb-2 pt-3 active:cursor-grabbing"
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded text-ink-faint transition-colors hover:bg-paper-raised hover:text-ink-muted"
          title="Arrastar coluna"
        >
          <GripVertical className="h-4 w-4" />
        </span>

        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') {
                setRenameValue(column.name)
                setRenaming(false)
              }
            }}
            className="min-w-0 flex-1 rounded border border-edge bg-paper-raised px-2 py-0.5 text-[13px] font-semibold ring-focus"
          />
        ) : (
          <button
            onClick={() => {
              setRenameValue(column.name)
              setRenaming(true)
            }}
            className={clsx(
              'flex min-w-0 flex-1 items-center gap-1.5 truncate text-left text-[12.5px] font-semibold uppercase tracking-[0.06em] hover:opacity-80',
              cStyle.title,
            )}
          >
            <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', cStyle.dot)} />
            <span className="truncate">{column.name}</span>
          </button>
        )}

        <span className="rounded bg-paper-raised px-1.5 py-0.5 text-2xs font-medium text-ink-muted shadow-inset">
          {column.cardIds.length}
        </span>

        <Popover
          align="right"
          trigger={({ toggle }) => (
            <button
              onClick={toggle}
              className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-paper-raised hover:text-ink"
              title="Opções"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        >
          {({ close }) => (
            <div>
              <MenuItem
                icon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => {
                  setRenameValue(column.name)
                  setRenaming(true)
                  close()
                }}
              >
                Renomear coluna
              </MenuItem>
              <MenuItem
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setComposing(true)
                  close()
                }}
              >
                Adicionar card
              </MenuItem>
              <MenuDivider />
              <div className="px-2 pb-1 pt-1">
                <div className="mb-1.5 flex items-center gap-1.5 text-ink-soft">
                  <Palette className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="text-2xs font-semibold uppercase tracking-[0.08em]">
                    Cor · {COLUMN_COLOR_NAMES[color]}
                  </span>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {COLUMN_COLORS.map((c) => {
                    const s = columnStyles[c]
                    const active = color === c
                    return (
                      <button
                        key={c}
                        onClick={() => setColumnColor(projectId, column.id, c)}
                        title={COLUMN_COLOR_NAMES[c]}
                        className={clsx(
                          'flex h-6 w-6 items-center justify-center rounded ring-1 ring-inset transition-transform hover:scale-110',
                          s.swatch,
                          active && 'ring-2 ring-ink',
                        )}
                      >
                        <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} />
                      </button>
                    )
                  })}
                </div>
              </div>
              <MenuDivider />
              <MenuItem
                danger
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  if (
                    column.cardIds.length === 0 ||
                    confirm(`Excluir a coluna "${column.name}" e todos seus ${column.cardIds.length} cards?`)
                  ) {
                    deleteColumn(projectId, column.id)
                  }
                  close()
                }}
              >
                Excluir coluna
              </MenuItem>
            </div>
          )}
        </Popover>
      </div>

      {/* Cards */}
      <div
        ref={setDroppableRef}
        className={clsx(
          'flex-1 space-y-2 overflow-y-auto px-2 pb-2 transition-colors',
          isOver && 'bg-accent/5',
        )}
      >
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {column.cardIds.map((cardId) => {
            const card = cards?.[cardId]
            if (!card) return null
            return (
              <Card
                key={cardId}
                card={card}
                columnId={column.id}
                projectId={projectId}
                onOpen={() => onOpenCard(cardId)}
              />
            )
          })}
        </SortableContext>

        {column.cardIds.length === 0 && !composing && (
          <div className="rounded-lg border border-dashed border-edge/80 px-3 py-6 text-center">
            <div className="text-[12.5px] text-ink-soft">Coluna vazia.</div>
            <div className="text-2xs text-ink-faint">Arraste um card ou adicione um.</div>
          </div>
        )}

        {composing && (
          <div className="rounded-lg border border-edge-strong bg-paper-raised p-2 shadow-card">
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  commitNewCard()
                }
                if (e.key === 'Escape') {
                  setNewTitle('')
                  setComposing(false)
                }
              }}
              placeholder="Título do card…"
              className="w-full resize-none bg-transparent text-[13.5px] leading-snug placeholder:text-ink-faint"
              rows={2}
            />
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <button
                onClick={() => {
                  setNewTitle('')
                  setComposing(false)
                }}
                className="rounded px-2 py-1 text-2xs font-medium text-ink-muted hover:bg-paper-sunken"
              >
                Cancelar
              </button>
              <button
                onClick={commitNewCard}
                className="rounded bg-ink px-2.5 py-1 text-2xs font-semibold text-paper hover:bg-ink/90"
              >
                Adicionar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add card button */}
      {!composing && (
        <button
          onClick={() => setComposing(true)}
          className="m-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-ink-muted transition-colors hover:bg-paper-raised hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
          Adicionar card
        </button>
      )}
    </div>
  )
}

export function ColumnPreview({ column, cardCount }: { column: ColumnT; cardCount: number }) {
  const color: ColumnColor = column.color ?? 'neutral'
  const s = columnStyles[color]
  return (
    <div className={clsx('dnd-overlay flex h-[80px] w-[300px] flex-col rounded-xl shadow-pop', s.surface)}>
      <div className="flex items-center gap-2 px-3 pt-3">
        <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} />
        <div className={clsx('text-[12.5px] font-semibold uppercase tracking-[0.06em]', s.title)}>
          {column.name}
        </div>
        <span className="rounded bg-paper-raised px-1.5 py-0.5 text-2xs font-medium text-ink-muted">
          {cardCount}
        </span>
      </div>
    </div>
  )
}
