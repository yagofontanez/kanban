import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { labelStyles, priorityStyles } from './ui'

interface Result {
  projectId: string
  projectName: string
  projectEmoji: string
  columnId: string
  columnName: string
  cardId: string
  title: string
  snippet: string | null
  priority: string
  labelChips: { color: string; name: string }[]
  score: number
}

interface Props {
  onClose: () => void
  onOpenCard: (projectId: string, cardId: string) => void
}

export function GlobalSearch({ onClose, onOpenCard }: Props) {
  const projects = useStore((s) => s.projects)
  const projectOrder = useStore((s) => s.projectOrder)
  const activeProjectId = useStore((s) => s.activeProjectId)

  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Result[] = []
    for (const pid of projectOrder) {
      const p = projects[pid]
      if (!p) continue
      for (const colId of p.columnOrder) {
        const col = p.columns[colId]
        if (!col) continue
        for (const cid of col.cardIds) {
          const c = p.cards[cid]
          if (!c) continue
          const title = c.title.toLowerCase()
          const desc = (c.description ?? '').toLowerCase()
          const comments = (c.comments ?? []).map((x) => x.body.toLowerCase()).join('  ')

          let score = 0
          let snippet: string | null = null
          if (title.includes(q)) {
            score += title.startsWith(q) ? 30 : 20
          }
          if (desc.includes(q)) {
            score += 10
            if (!snippet) {
              const idx = desc.indexOf(q)
              const start = Math.max(0, idx - 24)
              const end = Math.min(desc.length, idx + q.length + 40)
              snippet = (c.description ?? '').slice(start, end).replace(/\s+/g, ' ').trim()
            }
          }
          if (comments.includes(q)) {
            score += 5
            if (!snippet) snippet = 'menção em comentário'
          }
          if (score === 0) continue

          out.push({
            projectId: pid,
            projectName: p.name,
            projectEmoji: p.emoji,
            columnId: colId,
            columnName: col.name,
            cardId: cid,
            title: c.title,
            snippet,
            priority: c.priority ?? 'none',
            labelChips: (c.labelIds ?? [])
              .map((id) => p.labels[id])
              .filter(Boolean)
              .slice(0, 3)
              .map((l) => ({ color: l!.color, name: l!.name })),
            score,
          })
        }
      }
    }
    out.sort((a, b) => b.score - a.score)
    return out.slice(0, 40)
  }, [projects, projectOrder, query])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => Math.min(c + 1, Math.max(0, results.length - 1)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => Math.max(0, c - 1))
      } else if (e.key === 'Enter') {
        const r = results[cursor]
        if (r) {
          const setActiveProject = useStore.getState().setActiveProject
          if (r.projectId !== activeProjectId) setActiveProject(r.projectId)
          onOpenCard(r.projectId, r.cardId)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, cursor, onClose, onOpenCard, activeProjectId])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${cursor}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  return (
    <div className="modal-open">
      <div className="backdrop fixed inset-0 z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" onClick={onClose}>
        <div
          className="w-full max-w-[620px] animate-pop-in overflow-hidden rounded-2xl border border-edge bg-paper-raised shadow-pop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-b border-edge/70 px-4 py-3">
            <Search className="h-4 w-4 text-ink-muted" strokeWidth={2} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar em todos os projetos…"
              className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint"
            />
            <kbd className="hidden sm:inline-flex rounded border border-edge bg-paper-sunken px-1.5 py-0.5 text-2xs font-medium text-ink-muted">
              Esc
            </kbd>
          </div>

          <ul ref={listRef} className="max-h-[52vh] overflow-y-auto">
            {query.trim() === '' && (
              <li className="px-4 py-10 text-center text-[13px] text-ink-muted">
                Comece a digitar pra buscar cards em todos os projetos.
              </li>
            )}
            {query.trim() !== '' && results.length === 0 && (
              <li className="px-4 py-10 text-center text-[13px] text-ink-muted">
                Nenhum card encontrado.
              </li>
            )}
            {results.map((r, i) => {
              const active = i === cursor
              const ps = priorityStyles[r.priority as keyof typeof priorityStyles]
              return (
                <li key={`${r.projectId}:${r.cardId}`} data-idx={i}>
                  <button
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => {
                      const setActiveProject = useStore.getState().setActiveProject
                      if (r.projectId !== activeProjectId) setActiveProject(r.projectId)
                      onOpenCard(r.projectId, r.cardId)
                      onClose()
                    }}
                    className={clsx(
                      'flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors',
                      active ? 'bg-paper-sunken' : 'hover:bg-paper-sunken/60',
                    )}
                  >
                    <span className="mt-0.5 text-base leading-none">{r.projectEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-semibold text-ink">
                          {r.title}
                        </span>
                        {r.priority !== 'none' && (
                          <span
                            className={clsx(
                              'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                              ps.bg,
                              ps.text,
                            )}
                          >
                            {ps.short}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-2xs text-ink-soft">
                        <span className="truncate">{r.projectName}</span>
                        <span>·</span>
                        <span className="truncate">{r.columnName}</span>
                      </div>
                      {r.snippet && (
                        <div className="mt-1 truncate text-[12px] text-ink-muted">
                          {r.snippet}
                        </div>
                      )}
                      {r.labelChips.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {r.labelChips.map((l, idx) => {
                            const s = labelStyles[l.color as keyof typeof labelStyles]
                            return (
                              <span
                                key={idx}
                                className={clsx('rounded px-1.5 py-0.5 text-[10.5px] font-medium', s.bg, s.text)}
                              >
                                {l.name || 'sem título'}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center justify-between gap-2 border-t border-edge/70 bg-paper/60 px-4 py-2 text-2xs text-ink-soft">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-edge bg-paper-raised px-1 py-0.5 font-medium">
                  <ArrowUp className="h-2.5 w-2.5" />
                </kbd>
                <kbd className="rounded border border-edge bg-paper-raised px-1 py-0.5 font-medium">
                  <ArrowDown className="h-2.5 w-2.5" />
                </kbd>
                navegar
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-edge bg-paper-raised px-1 py-0.5 font-medium">
                  <CornerDownLeft className="h-2.5 w-2.5" />
                </kbd>
                abrir
              </span>
            </div>
            <span>{results.length > 0 ? `${results.length} resultado${results.length > 1 ? 's' : ''}` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
