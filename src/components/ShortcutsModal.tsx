import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

const sections: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: 'Geral',
    items: [
      { keys: ['?'], label: 'Mostrar esta ajuda' },
      { keys: ['⌘ / Ctrl', 'K'], label: 'Busca global entre projetos' },
      { keys: ['Esc'], label: 'Fechar modal / cancelar edição' },
    ],
  },
  {
    title: 'Kanban',
    items: [
      { keys: ['N'], label: 'Novo card na primeira coluna' },
      { keys: ['C'], label: 'Nova coluna' },
      { keys: ['F'], label: 'Abrir barra de filtros' },
    ],
  },
]

export function ShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-open">
      <div className="backdrop fixed inset-0 z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
        <div
          className="relative w-full max-w-[460px] animate-pop-in rounded-2xl border border-edge bg-paper-raised p-6 shadow-pop"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
            title="Fechar (Esc)"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="serif mb-1 text-[28px] leading-tight text-ink">Atalhos de teclado</div>
          <div className="mb-5 text-[12.5px] text-ink-muted">
            Um kanban mais rápido com menos cliques.
          </div>

          <div className="space-y-5">
            {sections.map((sec) => (
              <div key={sec.title}>
                <div className="eyebrow mb-2">{sec.title}</div>
                <ul className="space-y-1.5">
                  {sec.items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-ink">{it.label}</span>
                      <span className="flex items-center gap-1">
                        {it.keys.map((k, j) => (
                          <kbd
                            key={j}
                            className="rounded border border-edge bg-paper-sunken px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted shadow-inset"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
