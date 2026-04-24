import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
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
import { Plus, Download, Upload, MoreHorizontal, Keyboard, Search, Focus, LogOut, BarChart3, Sparkles } from 'lucide-react'
import { useStore, useActiveProject } from '@/store/useStore'
import { Column, ColumnPreview } from './Column'
import { CardPreview } from './Card'
import { CardModal } from './CardModal'
import { FilterToggle, FilterPanel, emptyFilters, type FilterState } from './FilterBar'
import { GlobalSearch } from './GlobalSearch'
import { ShortcutsModal } from './ShortcutsModal'
import { Popover, MenuItem, MenuDivider } from './Popover'
import { MetricsModal } from './MetricsModal'
import { ChangelogModal } from './ChangelogModal'
import type { Project } from '@/types'

export function Board() {
  const project = useActiveProject()
  const moveCard = useStore((s) => s.moveCard)
  const moveColumn = useStore((s) => s.moveColumn)
  const createColumn = useStore((s) => s.createColumn)
  const renameProject = useStore((s) => s.renameProject)
  const exportProject = useStore((s) => s.exportProject)
  const importProject = useStore((s) => s.importProject)
  const focusMode = useStore((s) => s.focusMode ?? false)
  const focusColumnId = useStore((s) => s.focusColumnId ?? null)
  const setFocusMode = useStore((s) => s.setFocusMode)

  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const newColumnInputRef = useRef<HTMLInputElement>(null)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [filterBarOpen, setFilterBarOpen] = useState(false)

  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)

  // Token — incremented to request the first column to open its composer.
  const [composeFirstToken, setComposeFirstToken] = useState<number | undefined>(undefined)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const columnIds = useMemo(() => project?.columnOrder ?? [], [project])

  // Pick the focus column: prefer explicit, then "em desenvolvimento"/"in progress", then first
  const resolvedFocusColumnId = useMemo(() => {
    if (!project) return null
    if (focusColumnId && project.columns[focusColumnId]) return focusColumnId
    const match = project.columnOrder.find((cid) => {
      const name = project.columns[cid]?.name?.toLowerCase() ?? ''
      return (
        name.includes('desenvolvimento') ||
        name.includes('em progresso') ||
        name.includes('in progress') ||
        name.includes('doing')
      )
    })
    return match ?? project.columnOrder[0] ?? null
  }, [project, focusColumnId])

  const visibleColumnIds = focusMode && resolvedFocusColumnId
    ? [resolvedFocusColumnId]
    : columnIds

  const enterFocus = () => {
    if (!project) return
    setFocusMode(true, resolvedFocusColumnId)
  }
  const exitFocus = () => setFocusMode(false, null)

  // ── Keyboard shortcuts ──────────────────────────────────────────
  const modalOpen = openCardId !== null || showGlobalSearch || showShortcuts
  const addingColumnRef = useRef(addingColumn)
  addingColumnRef.current = addingColumn

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      // Cmd/Ctrl+K — always, even while typing
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setShowGlobalSearch(true)
        return
      }

      if (isTyping) return
      if (modalOpen) return

      // "?" — show shortcuts help
      if (e.key === '?') {
        e.preventDefault()
        setShowShortcuts(true)
        return
      }

      if (e.key === 'n' || e.key === 'N') {
        if (!project || project.columnOrder.length === 0) return
        e.preventDefault()
        setComposeFirstToken((v) => (v ?? 0) + 1)
        return
      }

      if (e.key === 'c' || e.key === 'C') {
        if (!project) return
        e.preventDefault()
        setAddingColumn(true)
        // Focus the input on next tick
        setTimeout(() => newColumnInputRef.current?.focus(), 20)
        return
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setFilterBarOpen((v) => !v)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [project, modalOpen])

  if (!project) {
    return (
      <>
        <div className="flex flex-1 items-center justify-center px-8">
          <div className="max-w-[380px] text-center">
            <div className="serif mb-3 text-4xl leading-tight text-ink">
              Um lugar calmo<br />pra organizar suas ideias.
            </div>
            <div className="text-[13.5px] leading-relaxed text-ink-muted">
              Crie seu primeiro projeto na barra lateral. Tudo fica salvo localmente — nada sai do seu navegador.
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-2xs text-ink-soft">
              <kbd className="rounded border border-edge bg-paper-raised px-1.5 py-0.5 font-medium">⌘K</kbd>
              <span>busca global</span>
              <span>·</span>
              <kbd className="rounded border border-edge bg-paper-raised px-1.5 py-0.5 font-medium">?</kbd>
              <span>atalhos</span>
            </div>
          </div>
        </div>
        {showGlobalSearch && (
          <GlobalSearch
            onClose={() => setShowGlobalSearch(false)}
            onOpenCard={(_pid, cid) => setOpenCardId(cid)}
          />
        )}
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </>
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
    if (destColId === sourceColId) return

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

  const handleExport = () => {
    const json = exportProject(project.id)
    if (!json) return
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9\-]+/g, '-').replace(/^-|-$/g, '') || 'projeto'
    const date = new Date().toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `kanban-${safeName}-${date}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const id = importProject(text, { mode: 'new' })
      if (!id) alert('Não foi possível importar esse arquivo. Verifique se é um JSON válido exportado do Kanban.')
    } catch {
      alert('Erro ao ler o arquivo.')
    }
  }

  const totalCards = Object.keys(project.cards).length
  const labelsArr = project.labelOrder.map((id) => project.labels[id]).filter(Boolean)

  return (
    <div
      className={clsx('flex flex-1 flex-col overflow-hidden', focusMode && 'is-focus-mode')}
      style={focusMode ? { backgroundColor: '#F5F1E8' } : undefined}
    >
      {/* Header — hidden in focus mode */}
      {!focusMode && (
      <header className="relative flex shrink-0 items-center justify-between gap-4 border-b border-edge/70 bg-paper/80 px-8 py-5 backdrop-blur">
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
            onClick={() => setShowGlobalSearch(true)}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-edge bg-paper-raised px-3 py-1.5 text-[12.5px] font-medium text-ink-muted shadow-card transition-all hover:-translate-y-[1px] hover:text-ink"
            title="Busca global (⌘K)"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2.2} />
            Buscar
            <kbd className="ml-1 rounded border border-edge bg-paper-sunken px-1 py-0.5 text-[10px] font-medium text-ink-muted">
              ⌘K
            </kbd>
          </button>

          <FilterToggle
            filters={filters}
            expanded={filterBarOpen}
            onToggle={() => setFilterBarOpen((v) => !v)}
          />

          <button
            onClick={() => setAddingColumn(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-paper-raised px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-card transition-all hover:border-edge-strong hover:-translate-y-[1px]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            Nova coluna
          </button>

          <button
            onClick={enterFocus}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-edge bg-paper-raised px-3 py-1.5 text-[12.5px] font-medium text-ink-muted shadow-card transition-all hover:-translate-y-[1px] hover:text-ink"
            title="Modo foco"
          >
            <Focus className="h-3.5 w-3.5" strokeWidth={2.2} />
            Foco
          </button>

          <Popover
            align="right"
            trigger={({ toggle }) => (
              <button
                onClick={toggle}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-paper-raised text-ink-muted shadow-card transition-all hover:-translate-y-[1px] hover:text-ink"
                title="Opções do projeto"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
          >
            {({ close }) => (
              <div>
                <MenuItem
                  icon={<BarChart3 className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setShowMetrics(true)
                    close()
                  }}
                >
                  Métricas
                </MenuItem>
                <MenuItem
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setShowChangelog(true)
                    close()
                  }}
                >
                  Gerar changelog
                </MenuItem>
                <MenuItem
                  icon={<Focus className="h-3.5 w-3.5" />}
                  onClick={() => {
                    enterFocus()
                    close()
                  }}
                >
                  Modo foco
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={() => {
                    handleExport()
                    close()
                  }}
                >
                  Exportar projeto (JSON)
                </MenuItem>
                <MenuItem
                  icon={<Upload className="h-3.5 w-3.5" />}
                  onClick={() => {
                    handleImportClick()
                    close()
                  }}
                >
                  Importar projeto…
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<Keyboard className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setShowShortcuts(true)
                    close()
                  }}
                >
                  Atalhos de teclado
                </MenuItem>
              </div>
            )}
          </Popover>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </header>
      )}

      {filterBarOpen && !focusMode && (
        <FilterPanel
          labels={labelsArr}
          filters={filters}
          setFilters={setFilters}
          onClose={() => setFilterBarOpen(false)}
        />
      )}

      {/* Board */}
      <div className="relative flex-1 overflow-x-auto overflow-y-hidden">
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
            <SortableContext items={visibleColumnIds} strategy={horizontalListSortingStrategy}>
              {visibleColumnIds.map((colId, idx) => {
                const col = project.columns[colId]
                if (!col) return null
                const isFirst = idx === 0
                return (
                  <div key={colId} className="group h-full min-h-0">
                    <Column
                      projectId={project.id}
                      column={col}
                      onOpenCard={(cardId) => setOpenCardId(cardId)}
                      filters={filters}
                      composeToken={isFirst ? composeFirstToken : undefined}
                    />
                  </div>
                )
              })}
            </SortableContext>

            {/* Add column (hidden in focus mode) */}
            {!focusMode && (
            <div className="h-full w-[300px] shrink-0">
              {addingColumn ? (
                <div className="rounded-xl border border-edge-strong bg-paper-raised p-2 shadow-card">
                  <input
                    ref={newColumnInputRef}
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
            )}
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

      {showGlobalSearch && (
        <GlobalSearch
          onClose={() => setShowGlobalSearch(false)}
          onOpenCard={(_pid, cid) => setOpenCardId(cid)}
        />
      )}

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {showMetrics && project && (
        <MetricsModal project={project} onClose={() => setShowMetrics(false)} />
      )}

      {showChangelog && project && (
        <ChangelogModal project={project} onClose={() => setShowChangelog(false)} />
      )}

      {focusMode && (
        <button
          onClick={exitFocus}
          className="fixed bottom-4 left-1/2 z-[1400] inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-edge bg-paper-raised/95 px-4 py-2 text-[12.5px] font-semibold text-ink shadow-pop backdrop-blur transition-all hover:-translate-x-1/2 hover:-translate-y-[1px]"
          title="Sair do modo foco (Esc)"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2.2} />
          Sair do modo foco
        </button>
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
