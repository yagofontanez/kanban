import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  X,
  CalendarDays,
  Tag,
  Trash2,
  MessageSquarePlus,
  AlignLeft,
  Check,
  Pencil,
  Plus,
  Flag,
  CheckSquare,
  Link as LinkIcon,
  History,
  ExternalLink,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { ActivityEvent, Card, Label, LabelColor, Priority } from '@/types'
import {
  LABEL_COLORS,
  LABEL_NICENAMES,
  PRIORITY_ORDER,
  formatDateTime,
  formatRelative,
  labelStyles,
  priorityStyles,
} from './ui'
import { Popover, MenuItem, MenuDivider } from './Popover'

interface Props {
  projectId: string
  card: Card
  columnId: string
  onClose: () => void
}

export function CardModal({ projectId, card, columnId, onClose }: Props) {
  const updateCard = useStore((s) => s.updateCard)
  const deleteCard = useStore((s) => s.deleteCard)
  const addComment = useStore((s) => s.addComment)
  const deleteComment = useStore((s) => s.deleteComment)

  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [comment, setComment] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => setTitle(card.title), [card.title])
  useEffect(() => setDescription(card.description), [card.description])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [title])

  const commitTitle = () => {
    const t = title.trim() || 'Sem título'
    if (t !== card.title) updateCard(projectId, card.id, { title: t })
  }

  const commitDescription = () => {
    if (description !== card.description) updateCard(projectId, card.id, { description })
  }

  const setDue = (iso: string | null) => {
    updateCard(projectId, card.id, { dueDate: iso })
  }

  const submitComment = () => {
    if (!comment.trim()) return
    addComment(projectId, card.id, comment)
    setComment('')
  }

  return (
    <div className="modal-open">
      {/* Backdrop — fixed, doesn't scroll */}
      <div
        className="backdrop fixed inset-0 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Scroll container */}
      <div
        className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
        onClick={onClose}
      >
        <div className="flex min-h-full items-start justify-center px-4 py-[5vh]">
          <div
            className="relative w-full max-w-[960px] animate-pop-in rounded-2xl border border-edge bg-paper-raised shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
              title="Fechar (Esc)"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header with pills */}
            <div className="border-b border-edge/70 px-8 pt-7 pb-5 pr-14">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <LabelsEditor projectId={projectId} card={card} />
                <DueDateEditor card={card} onSet={setDue} />
                <PriorityEditor projectId={projectId} card={card} />
              </div>

              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitTitle()
                    ;(e.target as HTMLTextAreaElement).blur()
                  }
                }}
                rows={1}
                className="w-full resize-none bg-transparent text-[26px] font-semibold leading-tight tracking-tightish text-ink outline-none"
                placeholder="Título do card"
              />
            </div>

            {/* Two-column body */}
            <div className="grid gap-0 px-0 lg:grid-cols-[1fr_320px]">
              {/* Main column */}
              <div className="border-edge/70 px-8 py-6 lg:border-r">
                {/* Description */}
                <section>
                  <div className="mb-2 flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                    <span className="eyebrow">Descrição</span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={commitDescription}
                    placeholder="Adicione uma descrição, contexto, links…"
                    rows={4}
                    className="w-full resize-y rounded-lg border border-edge bg-paper px-3.5 py-3 text-[14px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-edge-strong focus:bg-paper-raised focus:ring-focus"
                  />
                </section>

                <ChecklistSection projectId={projectId} card={card} />
                <LinksSection projectId={projectId} card={card} />

                {/* Comments */}
                <section className="mt-8">
                  <div className="mb-3 flex items-center gap-1.5">
                    <MessageSquarePlus className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                    <span className="eyebrow">Comentários</span>
                    {card.comments.length > 0 && (
                      <span className="text-2xs text-ink-soft">· {card.comments.length}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault()
                          submitComment()
                        }
                      }}
                      placeholder="Escreva um comentário…  (⌘+Enter para enviar)"
                      rows={2}
                      className="flex-1 resize-none rounded-lg border border-edge bg-paper px-3 py-2 text-[13.5px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-edge-strong focus:bg-paper-raised focus:ring-focus"
                    />
                    <button
                      onClick={submitComment}
                      disabled={!comment.trim()}
                      className={clsx(
                        'shrink-0 self-start rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-all',
                        comment.trim()
                          ? 'bg-ink text-paper hover:-translate-y-[1px] hover:bg-ink/90'
                          : 'bg-paper-sunken text-ink-faint',
                      )}
                    >
                      Enviar
                    </button>
                  </div>

                  {card.comments.length > 0 && (
                    <ul className="mt-4 space-y-3">
                      {[...card.comments].reverse().map((c) => (
                        <li
                          key={c.id}
                          className="group rounded-lg border border-edge/70 bg-paper/50 px-3.5 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-2xs font-medium uppercase tracking-[0.06em] text-ink-soft">
                              Você · {formatDateTime(c.createdAt)}
                            </span>
                            <button
                              onClick={() => deleteComment(projectId, card.id, c.id)}
                              className="opacity-0 transition-opacity hover:text-[#8F3248] group-hover:opacity-100"
                              title="Excluir comentário"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-ink-muted" />
                            </button>
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
                            {c.body}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              {/* Sidebar: activity */}
              <aside className="bg-paper/50 px-6 py-6 lg:px-5">
                <ActivitySection card={card} />
              </aside>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between border-t border-edge/70 px-8 py-4">
              <div className="text-2xs text-ink-soft">
                Criado {formatDateTime(card.createdAt)}
              </div>
              <button
                onClick={() => {
                  if (confirm('Excluir este card?')) {
                    deleteCard(projectId, columnId, card.id)
                    onClose()
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs font-medium text-ink-muted transition-colors hover:bg-[#FBEAED] hover:text-[#8F3248]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────── Label chooser ─────────────
   - Shows project's preset labels
   - Click a row → toggle on/off for this card
   - Create / rename / recolor / delete presets in place
*/
function LabelsEditor({ projectId, card }: { projectId: string; card: Card }) {
  const project = useStore((s) => s.projects[projectId])
  const toggleCardLabel = useStore((s) => s.toggleCardLabel)
  const createLabel = useStore((s) => s.createLabel)
  const updateLabel = useStore((s) => s.updateLabel)
  const deleteLabel = useStore((s) => s.deleteLabel)

  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState<LabelColor>('slate')

  const labels: Label[] = useMemo(() => {
    if (!project) return []
    return project.labelOrder
      .map((id) => project.labels[id])
      .filter((l): l is Label => Boolean(l))
  }, [project])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return labels
    return labels.filter((l) => l.name.toLowerCase().includes(q))
  }, [labels, query])

  const exactMatch = useMemo(
    () => labels.find((l) => l.name.toLowerCase() === query.trim().toLowerCase()),
    [labels, query],
  )

  const applied = (id: string) => card.labelIds.includes(id)
  const appliedLabels = labels.filter((l) => applied(l.id))

  const startEdit = (l: Label) => {
    setEditingId(l.id)
    setEditName(l.name)
    setEditColor(l.color)
  }
  const commitEdit = () => {
    if (!editingId) return
    updateLabel(projectId, editingId, { name: editName, color: editColor })
    setEditingId(null)
  }
  const cancelEdit = () => setEditingId(null)

  const createFromQuery = () => {
    const name = query.trim()
    if (!name || exactMatch) return
    const id = createLabel(projectId, name, 'slate')
    toggleCardLabel(projectId, card.id, id)
    setQuery('')
  }

  return (
    <Popover
      align="left"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors',
            appliedLabels.length > 0
              ? 'bg-paper-sunken text-ink'
              : 'border border-dashed border-edge text-ink-muted hover:bg-paper-sunken',
          )}
        >
          <Tag className="h-3.5 w-3.5" strokeWidth={2} />
          {appliedLabels.length > 0
            ? `${appliedLabels.length} label${appliedLabels.length > 1 ? 's' : ''}`
            : 'Adicionar label'}
        </button>
      )}
    >
      {() => (
        <div className="w-[280px] p-1">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="eyebrow">Labels</div>
            <div className="text-2xs text-ink-soft">{labels.length} no projeto</div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !exactMatch && query.trim()) createFromQuery()
            }}
            placeholder="Buscar ou criar…"
            className="mx-1 mb-1 block w-[calc(100%-0.5rem)] rounded border border-edge bg-paper px-2 py-1 text-[12.5px] ring-focus focus:border-edge-strong"
          />

          <ul className="max-h-[260px] space-y-0.5 overflow-y-auto pr-0.5">
            {filtered.map((l) => {
              const s = labelStyles[l.color]
              const isOn = applied(l.id)
              const isEditing = editingId === l.id

              if (isEditing) {
                return (
                  <li key={l.id} className="rounded bg-paper-sunken p-1.5">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      placeholder="Nome"
                      className="mb-1.5 block w-full rounded border border-edge bg-paper px-2 py-1 text-[12.5px] ring-focus focus:border-edge-strong"
                    />
                    <div className="flex flex-wrap gap-1">
                      {LABEL_COLORS.map((c) => {
                        const cs = labelStyles[c]
                        return (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            title={LABEL_NICENAMES[c]}
                            className={clsx(
                              'h-5 w-5 rounded ring-1 ring-inset transition-transform hover:scale-110',
                              cs.bg,
                              cs.ring,
                              editColor === c && 'ring-2 ring-ink',
                            )}
                          />
                        )
                      })}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (confirm(`Excluir o label "${l.name}"? Será removido de todos os cards.`)) {
                            deleteLabel(projectId, l.id)
                            cancelEdit()
                          }
                        }}
                        className="rounded px-1.5 py-0.5 text-2xs font-medium text-[#8F3248] hover:bg-[#FBEAED]"
                      >
                        Excluir
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={cancelEdit}
                          className="rounded px-2 py-0.5 text-2xs font-medium text-ink-muted hover:bg-paper"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={commitEdit}
                          className="rounded bg-ink px-2 py-0.5 text-2xs font-semibold text-paper hover:bg-ink/90"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </li>
                )
              }

              return (
                <li key={l.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => toggleCardLabel(projectId, card.id, l.id)}
                    className={clsx(
                      'flex flex-1 items-center gap-2 rounded px-1.5 py-1 text-left transition-colors hover:bg-paper-sunken',
                    )}
                  >
                    <span
                      className={clsx(
                        'flex h-4 w-4 items-center justify-center rounded',
                        isOn ? 'bg-ink text-paper' : 'border border-edge',
                      )}
                    >
                      {isOn && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span
                      className={clsx(
                        'inline-flex min-w-0 flex-1 items-center gap-1 rounded px-1.5 py-0.5 text-[12px] font-medium',
                        s.bg,
                        s.text,
                      )}
                    >
                      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', s.dot)} />
                      <span className="truncate">{l.name || <em>sem nome</em>}</span>
                    </span>
                  </button>
                  <button
                    onClick={() => startEdit(l)}
                    className="flex h-6 w-6 items-center justify-center rounded text-ink-muted opacity-0 transition-opacity hover:bg-paper-sunken hover:text-ink group-hover:opacity-100"
                    title="Editar label"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </li>
              )
            })}

            {filtered.length === 0 && query.trim() && (
              <li className="px-2 py-1 text-2xs text-ink-soft">
                Nenhum label encontrado.
              </li>
            )}
          </ul>

          {query.trim() && !exactMatch && (
            <>
              <MenuDivider />
              <MenuItem
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={createFromQuery}
              >
                Criar “{query.trim()}”
              </MenuItem>
            </>
          )}

          {!query.trim() && (
            <>
              <MenuDivider />
              <MenuItem
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  const id = createLabel(projectId, 'Novo label', 'slate')
                  startEdit({ id, name: 'Novo label', color: 'slate' })
                }}
              >
                Criar novo label
              </MenuItem>
            </>
          )}
        </div>
      )}
    </Popover>
  )
}

function PriorityEditor({ projectId, card }: { projectId: string; card: Card }) {
  const setCardPriority = useStore((s) => s.setCardPriority)
  const priority = card.priority ?? 'none'
  const s = priorityStyles[priority]

  return (
    <Popover
      align="left"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors',
            priority === 'none'
              ? 'border border-dashed border-edge text-ink-muted hover:bg-paper-sunken'
              : `${s.bg} ${s.text}`,
          )}
        >
          <Flag className="h-3.5 w-3.5" strokeWidth={2} />
          {priority === 'none' ? 'Prioridade' : s.label}
        </button>
      )}
    >
      {({ close }) => (
        <div className="w-[200px] p-1">
          <div className="eyebrow px-2 py-1">Prioridade</div>
          <ul className="space-y-0.5">
            {PRIORITY_ORDER.map((p) => {
              const ps = priorityStyles[p]
              const active = priority === p
              return (
                <li key={p}>
                  <button
                    onClick={() => {
                      setCardPriority(projectId, card.id, p)
                      close()
                    }}
                    className={clsx(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-paper-sunken',
                      active && 'bg-paper-sunken',
                    )}
                  >
                    <span className={clsx('h-2 w-2 rounded-full', ps.dot)} />
                    <span className="flex-1">{ps.label}</span>
                    {active && <Check className="h-3.5 w-3.5 text-ink" strokeWidth={2.5} />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Popover>
  )
}

function ChecklistSection({ projectId, card }: { projectId: string; card: Card }) {
  const addChecklistItem = useStore((s) => s.addChecklistItem)
  const toggleChecklistItem = useStore((s) => s.toggleChecklistItem)
  const updateChecklistItemText = useStore((s) => s.updateChecklistItemText)
  const removeChecklistItem = useStore((s) => s.removeChecklistItem)

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const items = card.checklist ?? []
  const done = items.filter((i) => i.done).length
  const total = items.length
  const pct = total > 0 ? (done / total) * 100 : 0

  const submit = () => {
    if (!draft.trim()) return
    addChecklistItem(projectId, card.id, draft)
    setDraft('')
  }

  return (
    <div className="mt-8">
      <div className="mb-2 flex items-center gap-1.5">
        <CheckSquare className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
        <span className="eyebrow">Checklist</span>
        {total > 0 && (
          <span className="text-2xs text-ink-soft">
            · {done}/{total}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-sunken">
          <div
            className={clsx(
              'h-full rounded-full transition-[width] duration-300',
              done === total ? 'bg-label-sage' : 'bg-ink/60',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id} className="group flex items-center gap-2 rounded px-1 py-0.5 hover:bg-paper-sunken/50">
            <button
              onClick={() => toggleChecklistItem(projectId, card.id, it.id)}
              className={clsx(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors',
                it.done ? 'bg-label-sage text-paper' : 'border border-edge-strong hover:bg-paper-sunken',
              )}
            >
              {it.done && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
            {editingId === it.id ? (
              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => {
                  if (editText.trim()) updateChecklistItemText(projectId, card.id, it.id, editText)
                  setEditingId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 rounded border border-edge bg-paper px-2 py-0.5 text-[13px] ring-focus focus:border-edge-strong"
              />
            ) : (
              <button
                onClick={() => {
                  setEditingId(it.id)
                  setEditText(it.text)
                }}
                className={clsx(
                  'min-w-0 flex-1 truncate text-left text-[13px]',
                  it.done ? 'text-ink-muted line-through' : 'text-ink',
                )}
              >
                {it.text}
              </button>
            )}
            <button
              onClick={() => removeChecklistItem(projectId, card.id, it.id)}
              className="opacity-0 transition-opacity hover:text-[#8F3248] group-hover:opacity-100"
              title="Remover item"
            >
              <Trash2 className="h-3.5 w-3.5 text-ink-muted" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="Adicionar item…"
          className="flex-1 rounded-lg border border-edge bg-paper px-3 py-1.5 text-[13px] ring-focus focus:border-edge-strong focus:bg-paper-raised"
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-all',
            draft.trim()
              ? 'bg-ink text-paper hover:-translate-y-[1px] hover:bg-ink/90'
              : 'bg-paper-sunken text-ink-faint',
          )}
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}

function LinksSection({ projectId, card }: { projectId: string; card: Card }) {
  const addCardLink = useStore((s) => s.addCardLink)
  const updateCardLink = useStore((s) => s.updateCardLink)
  const removeCardLink = useStore((s) => s.removeCardLink)

  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')

  const links = card.links ?? []

  const submit = () => {
    if (!url.trim()) return
    addCardLink(projectId, card.id, title, url)
    setTitle('')
    setUrl('')
  }

  const prettyHost = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, '')
    } catch {
      return u
    }
  }

  const commitEdit = (id: string) => {
    if (!editUrl.trim()) return
    updateCardLink(projectId, card.id, id, {
      title: editTitle.trim() || editUrl.trim(),
      url: editUrl.trim(),
    })
    setEditingId(null)
  }

  return (
    <div className="mt-8">
      <div className="mb-2 flex items-center gap-1.5">
        <LinkIcon className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
        <span className="eyebrow">Links</span>
        {links.length > 0 && <span className="text-2xs text-ink-soft">· {links.length}</span>}
      </div>

      {links.length > 0 && (
        <ul className="mb-3 space-y-1">
          {links.map((l) => (
            <li
              key={l.id}
              className="group flex items-center gap-2 rounded-lg border border-edge/70 bg-paper/50 px-3 py-2"
            >
              {editingId === l.id ? (
                <div className="flex flex-1 flex-col gap-1.5">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Título"
                    className="rounded border border-edge bg-paper px-2 py-1 text-[13px] ring-focus focus:border-edge-strong"
                  />
                  <input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(l.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    placeholder="URL"
                    className="rounded border border-edge bg-paper px-2 py-1 text-[12.5px] font-mono text-ink-muted ring-focus focus:border-edge-strong"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded px-2 py-0.5 text-2xs font-medium text-ink-muted hover:bg-paper-sunken"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => commitEdit(l.id)}
                      className="rounded bg-ink px-2 py-0.5 text-2xs font-semibold text-paper hover:bg-ink/90"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-w-0 flex-1 items-center gap-2 text-[13.5px] text-ink hover:text-accent-ink"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={2} />
                    <span className="min-w-0 truncate font-medium">{l.title || prettyHost(l.url)}</span>
                    <span className="shrink-0 text-2xs text-ink-soft">{prettyHost(l.url)}</span>
                  </a>
                  <button
                    onClick={() => {
                      setEditingId(l.id)
                      setEditTitle(l.title)
                      setEditUrl(l.url)
                    }}
                    className="opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5 text-ink-muted" />
                  </button>
                  <button
                    onClick={() => removeCardLink(projectId, card.id, l.id)}
                    className="opacity-0 transition-opacity hover:text-[#8F3248] group-hover:opacity-100"
                    title="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-ink-muted" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-1.5 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          className="flex-1 rounded-lg border border-edge bg-paper px-3 py-1.5 text-[13px] ring-focus focus:border-edge-strong focus:bg-paper-raised"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="https://…"
          className="flex-1 rounded-lg border border-edge bg-paper px-3 py-1.5 font-mono text-[12.5px] ring-focus focus:border-edge-strong focus:bg-paper-raised"
        />
        <button
          onClick={submit}
          disabled={!url.trim()}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-all',
            url.trim()
              ? 'bg-ink text-paper hover:-translate-y-[1px] hover:bg-ink/90'
              : 'bg-paper-sunken text-ink-faint',
          )}
        >
          Adicionar link
        </button>
      </div>
    </div>
  )
}

function describeActivity(ev: ActivityEvent): { icon: React.ReactNode; body: React.ReactNode } {
  const data = ev.data ?? {}
  switch (ev.type) {
    case 'created':
      return { icon: <Plus className="h-3 w-3" />, body: <>criou o card</> }
    case 'title_changed':
      return {
        icon: <Pencil className="h-3 w-3" />,
        body: <>renomeou para <em className="not-italic font-medium text-ink">{data.to}</em></>,
      }
    case 'description_changed':
      return { icon: <AlignLeft className="h-3 w-3" />, body: <>atualizou a descrição</> }
    case 'moved':
      return {
        icon: <History className="h-3 w-3" />,
        body: (
          <>
            moveu de <em className="not-italic font-medium text-ink">{data.fromName}</em>
            {' → '}
            <em className="not-italic font-medium text-ink">{data.toName}</em>
          </>
        ),
      }
    case 'label_added':
      return {
        icon: <Tag className="h-3 w-3" />,
        body: <>adicionou label <em className="not-italic font-medium text-ink">{data.labelName || data.labelColor}</em></>,
      }
    case 'label_removed':
      return {
        icon: <Tag className="h-3 w-3" />,
        body: <>removeu label <em className="not-italic font-medium text-ink">{data.labelName || data.labelColor}</em></>,
      }
    case 'due_set':
      return {
        icon: <CalendarDays className="h-3 w-3" />,
        body: (
          <>
            definiu vencimento para{' '}
            <em className="not-italic font-medium text-ink">
              {new Date(`${data.iso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
            </em>
          </>
        ),
      }
    case 'due_removed':
      return { icon: <CalendarDays className="h-3 w-3" />, body: <>removeu o vencimento</> }
    case 'priority_changed':
      return {
        icon: <Flag className="h-3 w-3" />,
        body: (
          <>
            prioridade:{' '}
            <em className="not-italic font-medium text-ink">
              {priorityStyles[data.to as Priority]?.label ?? data.to}
            </em>
          </>
        ),
      }
    case 'checklist_added':
      return { icon: <CheckSquare className="h-3 w-3" />, body: <>adicionou o item <em className="not-italic font-medium text-ink">{data.text}</em></> }
    case 'checklist_removed':
      return { icon: <CheckSquare className="h-3 w-3" />, body: <>removeu o item <em className="not-italic font-medium text-ink">{data.text}</em></> }
    case 'checklist_toggled':
      return {
        icon: <CheckSquare className="h-3 w-3" />,
        body: data.done ? (
          <>concluiu <em className="not-italic font-medium text-ink">{data.text}</em></>
        ) : (
          <>desmarcou <em className="not-italic font-medium text-ink">{data.text}</em></>
        ),
      }
    case 'link_added':
      return { icon: <LinkIcon className="h-3 w-3" />, body: <>adicionou o link <em className="not-italic font-medium text-ink">{data.title}</em></> }
    case 'link_removed':
      return { icon: <LinkIcon className="h-3 w-3" />, body: <>removeu o link <em className="not-italic font-medium text-ink">{data.title}</em></> }
    case 'comment_added':
      return { icon: <MessageSquarePlus className="h-3 w-3" />, body: <>comentou</> }
    default:
      return { icon: <History className="h-3 w-3" />, body: <>atualizou o card</> }
  }
}

function ActivitySection({ card }: { card: Card }) {
  const [, tick] = useState(0)
  // Refresh relative timestamps every minute
  useEffect(() => {
    const t = setInterval(() => tick((v) => v + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  const events = [...(card.activity ?? [])].reverse()

  if (events.length === 0) return null

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-1.5">
        <History className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
        <span className="eyebrow">Atividade</span>
        <span className="text-2xs text-ink-soft">· {events.length}</span>
      </div>
      <ol className="relative space-y-2 border-l border-edge/80 pl-4">
        {events.map((ev) => {
          const { icon, body } = describeActivity(ev)
          return (
            <li key={ev.id} className="relative">
              <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-paper-raised text-ink-muted ring-1 ring-edge">
                {icon}
              </span>
              <div className="flex items-baseline gap-2 text-[12.5px]">
                <span className="text-ink-muted">{body}</span>
                <span className="text-2xs text-ink-soft">· {formatRelative(ev.createdAt)}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function DueDateEditor({
  card,
  onSet,
}: {
  card: Card
  onSet: (iso: string | null) => void
}) {
  return (
    <Popover
      align="left"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors',
            card.dueDate
              ? 'bg-paper-sunken text-ink'
              : 'border border-dashed border-edge text-ink-muted hover:bg-paper-sunken',
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
          {card.dueDate
            ? new Date(`${card.dueDate}T00:00:00`).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'Adicionar data'}
        </button>
      )}
    >
      {({ close }) => (
        <div className="w-[240px] p-2">
          <div className="eyebrow mb-1">Data de vencimento</div>
          <input
            type="date"
            value={card.dueDate ?? ''}
            onChange={(e) => onSet(e.target.value || null)}
            className="block w-full rounded border border-edge bg-paper px-2 py-1 text-[13px] ring-focus focus:border-edge-strong"
          />
          <div className="mt-2 flex justify-between">
            <MenuItem
              onClick={() => {
                onSet(null)
                close()
              }}
            >
              Remover
            </MenuItem>
          </div>
        </div>
      )}
    </Popover>
  )
}
