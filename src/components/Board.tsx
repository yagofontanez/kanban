import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useStore, useActiveProject } from '@/store/useStore'
import { Column, ColumnPreview } from './Column'
import { CardPreview } from './Card'
import { CardModal } from './CardModal'
import type { Project } from '@/types'

export function Board() {
  const project = useActiveProject()
  const moveCard = useStore((s) => s.moveCard)
  const moveColumn = useStore((s) => s.moveColumn)
  const createColumn = useStore((s) => s.createColumn)
  const renameProject = useStore((s) => s.renameProject)

  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const columnIds = useMemo(() => project?.columnOrder ?? [], [project])

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="max-w-[380px] text-center">
          <div className="serif mb-3 text-4xl leading-tight text-ink">
            Um lugar calmo<br />pra organizar suas ideias.
          </div>
          <div className="text-[13.5px] leading-relaxed text-ink-muted">
            Crie seu primeiro projeto na barra lateral. Tudo fica salvo localmente — nada sai do seu navegador.
          </div>
        </div>
      </div>
    )
  }

  const findCardContainer = (cardId: string): string | null => {
    for (const colId of project.columnOrder) {
      const col = project.columns[colId]
      if (col?.cardIds.includes(cardId)) return colId
    }
    return null
  }

  const handleDragStart = (e: DragStartEvent) => {
    const t = e.active.data.current?.type
    if (t === 'card') setActiveCardId(String(e.active.id))
    else if (t === 'column') setActiveColumnId(String(e.active.id))
  }

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const activeType = active.data.current?.type
    if (activeType !== 'card') return

    const activeId = String(active.id)
    const overId = String(over.id)
    const overType = over.data.current?.type

    const sourceColId = findCardContainer(activeId)
    if (!sourceColId) return

    // If over a column droppable or a column itself (empty col), append to that column
    let destColId: string | null = null
    let destIndex = 0

    if (overType === 'card') {
      destColId = over.data.current?.columnId as string
      const overCol = project.columns[destColId]
      if (!overCol) return
      const overIdx = overCol.cardIds.indexOf(overId)
      destIndex = overIdx === -1 ? overCol.cardIds.length : overIdx
    } else if (overType === 'column-droppable') {
      destColId = over.data.current?.columnId as string
      destIndex = project.columns[destColId]?.cardIds.length ?? 0
    } else if (overType === 'column') {
      destColId = over.data.current?.columnId as string
      destIndex = project.columns[destColId]?.cardIds.length ?? 0
    } else {
      return
    }

    if (!destColId) return
    if (destColId === sourceColId) return // let dragEnd handle in-col reordering

    moveCard(project.id, {
      activeCardId: activeId,
      sourceColId,
      destColId,
      destIndex,
    })
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveCardId(null)
    setActiveColumnId(null)
    if (!over) return

    const activeType = active.data.current?.type

    if (activeType === 'column') {
      const overType = over.data.current?.type
      let targetColId: string | null = null
      if (overType === 'column') {
        targetColId = String(over.id)
      } else if (overType === 'card' || overType === 'column-droppable') {
        targetColId = (over.data.current?.columnId as string) ?? null
      }
      if (targetColId && targetColId !== String(active.id)) {
        moveColumn(project.id, String(active.id), targetColId)
      }
      return
    }

    if (activeType === 'card') {
      const activeId = String(active.id)
      const overId = String(over.id)
      const overType = over.data.current?.type

      const sourceColId = findCardContainer(activeId)
      if (!sourceColId) return

      let destColId: string | null = null
      let destIndex = 0

      if (overType === 'card') {
        destColId = over.data.current?.columnId as string
        const destCol = project.columns[destColId]
        if (!destCol) return
        const overIdx = destCol.cardIds.indexOf(overId)
        destIndex = overIdx === -1 ? destCol.cardIds.length : overIdx
      } else if (overType === 'column-droppable') {
        destColId = over.data.current?.columnId as string
        destIndex = project.columns[destColId]?.cardIds.length ?? 0
      } else {
        return
      }

      if (!destColId) return

      moveCard(project.id, {
        activeCardId: activeId,
        sourceColId,
        destColId,
        destIndex,
      })
    }
  }

  const commitNewColumn = () => {
    const t = newColumnName.trim()
    if (t) createColumn(project.id, t)
    setNewColumnName('')
    setAddingColumn(false)
  }

  const commitTitle = () => {
    if (titleDraft.trim()) renameProject(project.id, titleDraft)
    setEditingTitle(false)
  }

  const totalCards = Object.keys(project.cards).length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-edge/70 bg-paper/80 px-8 py-5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-2xl leading-none">{project.emoji}</span>
          <div className="min-w-0">
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') {
                    setEditingTitle(false)
                  }
                }}
                className="w-[360px] max-w-full rounded border border-edge bg-paper-raised px-2 py-1 text-[22px] font-semibold tracking-tightish ring-focus"
              />
            ) : (
              <button
                onClick={() => {
                  setTitleDraft(project.name)
                  setEditingTitle(true)
                }}
                className="truncate text-left text-[22px] font-semibold tracking-tightish text-ink hover:text-accent-ink"
                title="Renomear projeto"
              >
                {project.name}
              </button>
            )}
            <div className="text-[12px] text-ink-muted">
              {project.columnOrder.length} colunas · {totalCards} cards
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddingColumn(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-paper-raised px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-card transition-all hover:border-edge-strong hover:-translate-y-[1px]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            Nova coluna
          </button>
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveCardId(null)
            setActiveColumnId(null)
          }}
        >
          <div className="flex h-full min-w-max gap-3 px-8 py-6">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {columnIds.map((colId) => {
                const col = project.columns[colId]
                if (!col) return null
                return (
                  <div key={colId} className="group h-[calc(100vh-160px)] min-h-0">
                    <Column
                      projectId={project.id}
                      column={col}
                      onOpenCard={(cardId) => setOpenCardId(cardId)}
                    />
                  </div>
                )
              })}
            </SortableContext>

            {/* Add column */}
            <div className="h-[calc(100vh-160px)] w-[300px] shrink-0">
              {addingColumn ? (
                <div className="rounded-xl border border-edge-strong bg-paper-raised p-2 shadow-card">
                  <input
                    autoFocus
                    placeholder="Nome da coluna"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitNewColumn()
                      if (e.key === 'Escape') {
                        setAddingColumn(false)
                        setNewColumnName('')
                      }
                    }}
                    className="w-full rounded border border-edge px-2.5 py-1.5 text-[13px] font-medium ring-focus"
                  />
                  <div className="mt-1.5 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setAddingColumn(false)
                        setNewColumnName('')
                      }}
                      className="rounded px-2 py-1 text-2xs font-medium text-ink-muted hover:bg-paper-sunken"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={commitNewColumn}
                      className="rounded bg-ink px-2.5 py-1 text-2xs font-semibold text-paper hover:bg-ink/90"
                    >
                      Criar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="flex h-[60px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-edge text-[12.5px] font-medium text-ink-muted transition-all hover:border-edge-strong hover:bg-paper-raised hover:text-ink"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Nova coluna
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCardId && project.cards[activeCardId] ? (
              <CardPreview
                card={project.cards[activeCardId]}
                labels={(project.cards[activeCardId].labelIds ?? [])
                  .map((id) => project.labels[id])
                  .filter(Boolean)}
              />
            ) : activeColumnId && project.columns[activeColumnId] ? (
              <ColumnPreview
                column={project.columns[activeColumnId]}
                cardCount={project.columns[activeColumnId].cardIds.length}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {openCardId && project.cards[openCardId] && (
        <CardModal
          projectId={project.id}
          card={project.cards[openCardId]}
          columnId={findCardColumnForModal(project, openCardId)}
          onClose={() => setOpenCardId(null)}
        />
      )}
    </div>
  )
}

function findCardColumnForModal(project: Project, cardId: string): string {
  for (const colId of project.columnOrder) {
    if (project.columns[colId]?.cardIds.includes(cardId)) return colId
  }
  return project.columnOrder[0] ?? ''
}
