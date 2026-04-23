import { useState, lazy, Suspense } from 'react'
import clsx from 'clsx'
import { Plus, MoreHorizontal, Pencil, Trash2, Smile } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Popover, MenuItem, MenuDivider } from './Popover'

const EmojiPicker = lazy(() => import('emoji-picker-react'))

export function Sidebar() {
  const projects = useStore((s) => s.projects)
  const projectOrder = useStore((s) => s.projectOrder)
  const activeProjectId = useStore((s) => s.activeProjectId)
  const setActiveProject = useStore((s) => s.setActiveProject)
  const createProject = useStore((s) => s.createProject)
  const renameProject = useStore((s) => s.renameProject)
  const deleteProject = useStore((s) => s.deleteProject)
  const setProjectEmoji = useStore((s) => s.setProjectEmoji)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [pickerForId, setPickerForId] = useState<string | null>(null)

  const commitRename = (id: string) => {
    renameProject(id, renameValue)
    setRenamingId(null)
    setRenameValue('')
  }

  const commitCreate = () => {
    const trimmed = newName.trim()
    if (trimmed) createProject(trimmed)
    setCreating(false)
    setNewName('')
  }

  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col border-r border-edge bg-paper-sunken/60">
      {/* Brand */}
      <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-paper shadow-card">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5">
              <rect x="3" y="4" width="2.5" height="12" rx="0.9" fill="currentColor" />
              <rect x="8.75" y="4" width="2.5" height="8" rx="0.9" fill="#B54A2C" />
              <rect x="14.5" y="4" width="2.5" height="5" rx="0.9" fill="currentColor" opacity="0.55" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tightish">Kanban</div>
            <div className="text-2xs text-ink-soft">offline · local-first</div>
          </div>
        </div>
      </div>

      {/* Projects label */}
      <div className="mt-2 flex items-center justify-between px-5">
        <div className="eyebrow">Projetos</div>
        <button
          onClick={() => {
            setCreating(true)
            setNewName('')
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-edge-soft hover:text-ink"
          title="Novo projeto"
        >
          <Plus className="h-[14px] w-[14px]" strokeWidth={2.2} />
        </button>
      </div>

      {/* Project list */}
      <nav className="mt-1.5 flex-1 overflow-y-auto px-2 pb-4">
        <ul className="space-y-0.5">
          {projectOrder.map((id) => {
            const p = projects[id]
            if (!p) return null
            const active = activeProjectId === id
            const columnCount = p.columnOrder.length
            const cardCount = Object.keys(p.cards).length

            if (renamingId === id) {
              return (
                <li key={id}>
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(id)
                      if (e.key === 'Escape') {
                        setRenamingId(null)
                        setRenameValue('')
                      }
                    }}
                    className="w-full rounded-md border border-edge bg-paper-raised px-3 py-1.5 text-[13.5px] font-medium ring-focus"
                  />
                </li>
              )
            }

            return (
              <li key={id}>
                <div
                  className={clsx(
                    'group relative flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors',
                    active
                      ? 'bg-paper-raised shadow-card'
                      : 'hover:bg-paper-raised/60',
                  )}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPickerForId(id)
                    }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[15px] leading-none transition-transform hover:scale-110"
                    title="Trocar ícone"
                  >
                    {p.emoji}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveProject(id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div
                      className={clsx(
                        'truncate text-[13.5px] tracking-tightish',
                        active ? 'font-semibold text-ink' : 'font-medium text-ink/85',
                      )}
                    >
                      {p.name}
                    </div>
                    <div className="text-2xs text-ink-soft">
                      {columnCount} colunas · {cardCount} cards
                    </div>
                  </button>

                  <div
                    className={clsx(
                      'shrink-0 transition-opacity',
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}
                  >
                    <Popover
                      align="right"
                      trigger={({ toggle }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggle()
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-edge-soft hover:text-ink"
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
                              setRenamingId(id)
                              setRenameValue(p.name)
                              close()
                            }}
                          >
                            Renomear
                          </MenuItem>
                          <MenuItem
                            icon={<Smile className="h-3.5 w-3.5" />}
                            onClick={() => {
                              setPickerForId(id)
                              close()
                            }}
                          >
                            Trocar ícone
                          </MenuItem>
                          <MenuDivider />
                          <MenuItem
                            danger
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            onClick={() => {
                              if (confirm(`Excluir o projeto "${p.name}"? Essa ação é permanente.`)) {
                                deleteProject(id)
                              }
                              close()
                            }}
                          >
                            Excluir projeto
                          </MenuItem>
                        </div>
                      )}
                    </Popover>
                  </div>
                </div>
              </li>
            )
          })}

          {creating && (
            <li>
              <input
                autoFocus
                placeholder="Nome do projeto"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={commitCreate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitCreate()
                  if (e.key === 'Escape') {
                    setCreating(false)
                    setNewName('')
                  }
                }}
                className="mt-1 w-full rounded-md border border-edge bg-paper-raised px-3 py-1.5 text-[13.5px] font-medium ring-focus"
              />
            </li>
          )}
        </ul>

        {projectOrder.length === 0 && !creating && (
          <div className="mt-2 rounded-lg border border-dashed border-edge px-4 py-6 text-center">
            <div className="serif mb-1 text-lg text-ink">Nada por aqui ainda.</div>
            <div className="mb-3 text-[12.5px] text-ink-muted">Crie seu primeiro projeto.</div>
            <button
              onClick={() => setCreating(true)}
              className="rounded-md bg-ink px-3 py-1.5 text-[12.5px] font-medium text-paper transition-transform hover:scale-[1.02]"
            >
              Novo projeto
            </button>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-edge/70 px-5 py-3">
        <div className="text-2xs text-ink-soft">
          Tudo salvo localmente.{' '}
          <span className="text-ink-muted">Suas anotações ficam no seu navegador.</span>
        </div>
      </div>

      {pickerForId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          onClick={() => setPickerForId(null)}
        >
          <div className="absolute inset-0 backdrop animate-fade-in" />
          <div
            className="relative z-10 animate-pop-in rounded-2xl border border-edge bg-paper-raised p-2 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="eyebrow">Escolher ícone</div>
              <button
                onClick={() => setPickerForId(null)}
                className="rounded px-2 py-1 text-2xs font-medium text-ink-muted hover:bg-paper-sunken"
              >
                Fechar
              </button>
            </div>
            <Suspense
              fallback={
                <div className="flex h-[420px] w-[360px] items-center justify-center text-sm text-ink-muted">
                  Carregando…
                </div>
              }
            >
              <EmojiPicker
                onEmojiClick={(data) => {
                  setProjectEmoji(pickerForId, data.emoji)
                  setPickerForId(null)
                }}
                emojiStyle={'native' as any}
                lazyLoadEmojis
                searchPlaceHolder="Buscar emoji…"
                width={360}
                height={440}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
              />
            </Suspense>
          </div>
        </div>
      )}
    </aside>
  )
}
