import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Filter, Search, X, Flag } from 'lucide-react'
import type { Label, Priority } from '@/types'
import { labelStyles, priorityStyles, PRIORITY_ORDER } from './ui'

export interface FilterState {
  query: string
  labelIds: string[]
  priorities: Priority[]
}

export const emptyFilters: FilterState = { query: '', labelIds: [], priorities: [] }

export function filtersActive(f: FilterState): number {
  return (
    (f.query.trim() ? 1 : 0) +
    f.labelIds.length +
    f.priorities.length
  )
}

interface ToggleProps {
  filters: FilterState
  expanded: boolean
  onToggle: () => void
}

export function FilterToggle({ filters, expanded, onToggle }: ToggleProps) {
  const activeCount = filtersActive(filters)
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium shadow-card transition-all hover:-translate-y-[1px]',
        activeCount > 0 || expanded
          ? 'border-edge-strong bg-paper-raised text-ink'
          : 'border-edge bg-paper-raised text-ink-muted hover:text-ink',
      )}
      title="Filtrar cards"
    >
      <Filter className="h-3.5 w-3.5" strokeWidth={2.2} />
      Filtrar
      {activeCount > 0 && (
        <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">
          {activeCount}
        </span>
      )}
    </button>
  )
}

interface PanelProps {
  labels: Label[]
  filters: FilterState
  setFilters: (next: FilterState) => void
  onClose: () => void
}

export function FilterPanel({ labels, filters, setFilters, onClose }: PanelProps) {
  const activeCount = filtersActive(filters)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(t)
  }, [])

  const toggleLabel = (id: string) => {
    setFilters({
      ...filters,
      labelIds: filters.labelIds.includes(id)
        ? filters.labelIds.filter((x) => x !== id)
        : [...filters.labelIds, id],
    })
  }

  const togglePriority = (p: Priority) => {
    setFilters({
      ...filters,
      priorities: filters.priorities.includes(p)
        ? filters.priorities.filter((x) => x !== p)
        : [...filters.priorities, p],
    })
  }

  const clearAll = () => setFilters(emptyFilters)

  return (
    <div
      className="shrink-0 border-b border-edge/70 px-8 py-3 animate-fade-in"
      style={{ backgroundColor: '#FAFAF5' }}
    >
      <div className="flex flex-wrap items-start gap-x-5 gap-y-2.5">
        {/* Search */}
        <div className="relative min-w-[220px] max-w-[360px] flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
            strokeWidth={2}
          />
          <input
            ref={inputRef}
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Buscar por título, descrição, comentário…"
            className="w-full rounded-lg border border-edge bg-paper-raised py-1.5 pl-8 pr-8 text-[13px] ring-focus focus:border-edge-strong"
          />
          {filters.query && (
            <button
              onClick={() => setFilters({ ...filters, query: '' })}
              className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-ink-muted hover:bg-paper-sunken hover:text-ink"
              title="Limpar busca"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="eyebrow">Labels</span>
            <div className="flex flex-wrap items-center gap-1">
              {labels.map((l) => {
                const s = labelStyles[l.color]
                const on = filters.labelIds.includes(l.id)
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={clsx(
                      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium transition-all',
                      on
                        ? `${s.bg} ${s.text} ring-1 ring-inset ${s.ring}`
                        : 'border border-edge bg-paper-raised text-ink-muted hover:bg-paper-sunken',
                    )}
                  >
                    <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} />
                    {l.name || 'sem título'}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Prioridade</span>
          <div className="flex flex-wrap items-center gap-1">
            {PRIORITY_ORDER.filter((p) => p !== 'none').map((p) => {
              const ps = priorityStyles[p]
              const on = filters.priorities.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={clsx(
                    'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium transition-all',
                    on
                      ? `${ps.bg} ${ps.text} ring-1 ring-inset ring-[#D9D5C8]`
                      : 'border border-edge bg-paper-raised text-ink-muted hover:bg-paper-sunken',
                  )}
                >
                  <Flag className="h-3 w-3" strokeWidth={2.2} />
                  {ps.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 self-end pb-0.5">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="rounded px-2 py-1 text-[12px] font-medium text-ink-muted hover:bg-paper-sunken hover:text-ink"
            >
              Limpar filtros
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-[12px] font-medium text-ink-muted hover:bg-paper-sunken hover:text-ink"
            title="Fechar"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export function matchesFilters(
  card: {
    title: string
    description?: string
    labelIds?: string[]
    priority?: Priority
    comments?: { body: string }[]
  },
  filters: FilterState,
): boolean {
  if (filters.labelIds.length > 0) {
    const ids = card.labelIds ?? []
    if (!filters.labelIds.every((id) => ids.includes(id))) return false
  }
  if (filters.priorities.length > 0) {
    const p = card.priority ?? 'none'
    if (!filters.priorities.includes(p)) return false
  }
  const q = filters.query.trim().toLowerCase()
  if (q) {
    const haystack = [
      card.title,
      card.description ?? '',
      ...(card.comments ?? []).map((c) => c.body),
    ]
      .join('  ')
      .toLowerCase()
    if (!haystack.includes(q)) return false
  }
  return true
}
