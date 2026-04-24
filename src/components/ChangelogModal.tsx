import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { X, Copy, CheckCircle2, Sparkles } from 'lucide-react'
import type { Label, Project } from '@/types'

interface Props {
  project: Project
  onClose: () => void
}

type PresetPeriod = 'week' | 'month' | 'custom'

function toISO(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function endOfDayMs(iso: string): number {
  const d = new Date(`${iso}T23:59:59`)
  return d.getTime()
}

function startOfDayMs(iso: string): number {
  const d = new Date(`${iso}T00:00:00`)
  return d.getTime()
}

export function ChangelogModal({ project, onClose }: Props) {
  const [preset, setPreset] = useState<PresetPeriod>('week')
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 3600 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 3600 * 1000)
  const [from, setFrom] = useState<string>(toISO(weekAgo))
  const [to, setTo] = useState<string>(toISO(today))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const applyPreset = (p: PresetPeriod) => {
    setPreset(p)
    if (p === 'week') {
      setFrom(toISO(weekAgo))
      setTo(toISO(today))
    } else if (p === 'month') {
      setFrom(toISO(monthAgo))
      setTo(toISO(today))
    }
  }

  const lastColId = project.columnOrder[project.columnOrder.length - 1]
  const lastCol = lastColId ? project.columns[lastColId] : null
  const lastColName = lastCol?.name ?? ''

  const { markdown, byLabel, total } = useMemo(() => {
    const fromMs = startOfDayMs(from)
    const toMs = endOfDayMs(to)
    const byLabel: Record<string, { labelName: string; labelColor?: string; items: { title: string; when: number }[] }> = {}
    const seen = new Set<string>()

    for (const c of Object.values(project.cards)) {
      const evs = (c.activity ?? []).filter(
        (e) => e.type === 'moved' && e.data?.toName === lastColName && e.createdAt >= fromMs && e.createdAt <= toMs,
      )
      if (evs.length === 0) continue
      // Latest such move
      const latest = evs.sort((a, b) => b.createdAt - a.createdAt)[0]
      if (seen.has(c.id)) continue
      seen.add(c.id)

      const labels: Label[] = (c.labelIds ?? [])
        .map((id) => project.labels[id])
        .filter((l): l is Label => Boolean(l))

      if (labels.length === 0) {
        const key = '_nolabel'
        byLabel[key] ??= { labelName: 'Outros', items: [] }
        byLabel[key].items.push({ title: c.title, when: latest.createdAt })
      } else {
        for (const l of labels) {
          const key = l.id
          byLabel[key] ??= { labelName: l.name || 'sem nome', labelColor: l.color, items: [] }
          byLabel[key].items.push({ title: c.title, when: latest.createdAt })
        }
      }
    }

    const entries = Object.entries(byLabel).sort((a, b) => {
      if (a[0] === '_nolabel') return 1
      if (b[0] === '_nolabel') return -1
      return a[1].labelName.localeCompare(b[1].labelName, 'pt-BR')
    })

    const total = Object.values(byLabel).reduce((acc, g) => acc + g.items.length, 0)

    const lines: string[] = []
    const period = `${new Date(`${from}T00:00:00`).toLocaleDateString('pt-BR')} – ${new Date(`${to}T00:00:00`).toLocaleDateString('pt-BR')}`
    lines.push(`# ${project.name} · Changelog`)
    lines.push('')
    lines.push(`_${period}_`)
    lines.push('')
    if (total === 0) {
      lines.push('_Nenhum card concluído no período._')
    } else {
      for (const [, group] of entries) {
        lines.push(`## ${capitalize(group.labelName)}`)
        lines.push('')
        // Dedup titles within a group
        const seenTitles = new Set<string>()
        for (const it of group.items.sort((a, b) => b.when - a.when)) {
          if (seenTitles.has(it.title)) continue
          seenTitles.add(it.title)
          lines.push(`- ${it.title}`)
        }
        lines.push('')
      }
    }

    return { markdown: lines.join('\n').trimEnd() + '\n', byLabel: entries, total }
  }, [project, from, to, lastColName])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = markdown
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="modal-open">
      <div className="backdrop fixed inset-0 z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
        <div className="flex min-h-full items-start justify-center px-4 py-[5vh]">
          <div
            className="relative w-full max-w-[780px] animate-pop-in rounded-2xl border border-edge bg-paper-raised shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
              title="Fechar (Esc)"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-edge/70 px-8 py-6">
              <div className="flex items-center gap-1.5 text-ink-muted">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="eyebrow">Changelog</span>
              </div>
              <div className="serif mt-1 text-[28px] leading-tight text-ink">{project.name}</div>
              <div className="mt-1 text-[12.5px] text-ink-muted">
                Cards movidos para <span className="font-medium text-ink">{lastColName || '—'}</span> no período, agrupados por label.
              </div>
            </div>

            <div className="px-8 py-5">
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="flex items-center gap-1">
                  {(['week', 'month', 'custom'] as PresetPeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => applyPreset(p)}
                      className={clsx(
                        'rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors',
                        preset === p
                          ? 'border-edge-strong bg-paper-sunken text-ink'
                          : 'border-edge text-ink-muted hover:bg-paper-sunken',
                      )}
                    >
                      {p === 'week' ? 'Última semana' : p === 'month' ? 'Último mês' : 'Personalizado'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-2xs text-ink-soft">De</span>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => {
                        setFrom(e.target.value)
                        setPreset('custom')
                      }}
                      className="rounded-md border border-edge bg-paper-raised px-2 py-1 text-[12px] ring-focus"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xs text-ink-soft">Até</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => {
                        setTo(e.target.value)
                        setPreset('custom')
                      }}
                      className="rounded-md border border-edge bg-paper-raised px-2 py-1 text-[12px] ring-focus"
                    />
                  </div>
                </div>

                <span className="ml-auto text-[12px] text-ink-muted">
                  {total} card{total === 1 ? '' : 's'} no período
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="eyebrow">Markdown</span>
                    <button
                      onClick={handleCopy}
                      disabled={total === 0}
                      className={clsx(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-2xs font-semibold transition-colors',
                        total === 0
                          ? 'bg-paper-sunken text-ink-faint'
                          : copied
                            ? 'bg-[#E3EFE7] text-[#386148]'
                            : 'bg-ink text-paper hover:bg-ink/90',
                      )}
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="max-h-[360px] overflow-auto rounded-lg border border-edge bg-paper px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink">
{markdown}
                  </pre>
                </div>
              </div>

              {total === 0 && (
                <div className="mt-3 rounded-lg border border-dashed border-edge px-4 py-3 text-[12.5px] text-ink-muted">
                  Nenhum card foi movido para <span className="font-medium text-ink">{lastColName || '—'}</span> nesse intervalo.
                </div>
              )}

              {byLabel.length > 0 && (
                <div className="mt-5">
                  <div className="eyebrow mb-1">Pré-visualização</div>
                  <div className="space-y-3 rounded-lg border border-edge/70 bg-paper/40 p-4">
                    {byLabel.map(([key, group]) => (
                      <div key={key}>
                        <div className="text-[13px] font-semibold text-ink">
                          {capitalize(group.labelName)}
                        </div>
                        <ul className="mt-0.5 space-y-0.5">
                          {Array.from(new Set(group.items.map((i) => i.title))).map((t) => (
                            <li key={t} className="text-[13px] text-ink-muted">
                              · {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
