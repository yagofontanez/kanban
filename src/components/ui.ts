import type { ColumnColor, LabelColor, Priority } from '@/types'

export const LABEL_COLORS: LabelColor[] = [
  'rose',
  'amber',
  'olive',
  'sage',
  'sky',
  'violet',
  'slate',
]

export const labelStyles: Record<LabelColor, { bg: string; text: string; dot: string; ring: string }> = {
  rose:   { bg: 'bg-[#FBEAED]', text: 'text-[#8F3248]', dot: 'bg-label-rose',   ring: 'ring-[#E9BCC6]' },
  amber:  { bg: 'bg-[#FAEEDB]', text: 'text-[#8A5D15]', dot: 'bg-label-amber',  ring: 'ring-[#E6C98C]' },
  olive:  { bg: 'bg-[#EEF0DC]', text: 'text-[#555F26]', dot: 'bg-label-olive',  ring: 'ring-[#C8CE95]' },
  sage:   { bg: 'bg-[#E3EFE7]', text: 'text-[#386148]', dot: 'bg-label-sage',   ring: 'ring-[#B2CCBB]' },
  sky:    { bg: 'bg-[#E1ECF6]', text: 'text-[#315B84]', dot: 'bg-label-sky',    ring: 'ring-[#A9C1D9]' },
  violet: { bg: 'bg-[#ECE6F3]', text: 'text-[#543C7D]', dot: 'bg-label-violet', ring: 'ring-[#BDAAD6]' },
  slate:  { bg: 'bg-[#E7E9EB]', text: 'text-[#464D55]', dot: 'bg-label-slate',  ring: 'ring-[#B5BAC1]' },
}

export const LABEL_NICENAMES: Record<LabelColor, string> = {
  rose: 'Coral',
  amber: 'Âmbar',
  olive: 'Oliva',
  sage: 'Salva',
  sky: 'Céu',
  violet: 'Violeta',
  slate: 'Ardósia',
}

export const COLUMN_COLORS: ColumnColor[] = [
  'neutral',
  'rose',
  'amber',
  'olive',
  'sage',
  'sky',
  'violet',
  'slate',
]

export const columnStyles: Record<
  ColumnColor,
  { dot: string; title: string; surface: string; swatch: string }
> = {
  neutral: { dot: 'bg-ink-faint',      title: 'text-ink-muted', surface: 'bg-paper-sunken/70',        swatch: 'bg-paper-sunken ring-edge' },
  rose:    { dot: 'bg-label-rose',     title: 'text-[#8F3248]', surface: 'bg-[#F8E9EC]/60',            swatch: 'bg-[#FBEAED] ring-[#E9BCC6]' },
  amber:   { dot: 'bg-label-amber',    title: 'text-[#8A5D15]', surface: 'bg-[#F8EDD9]/60',            swatch: 'bg-[#FAEEDB] ring-[#E6C98C]' },
  olive:   { dot: 'bg-label-olive',    title: 'text-[#555F26]', surface: 'bg-[#EDF0DA]/60',            swatch: 'bg-[#EEF0DC] ring-[#C8CE95]' },
  sage:    { dot: 'bg-label-sage',     title: 'text-[#386148]', surface: 'bg-[#E1EDE5]/60',            swatch: 'bg-[#E3EFE7] ring-[#B2CCBB]' },
  sky:     { dot: 'bg-label-sky',      title: 'text-[#315B84]', surface: 'bg-[#DFEAF5]/60',            swatch: 'bg-[#E1ECF6] ring-[#A9C1D9]' },
  violet:  { dot: 'bg-label-violet',   title: 'text-[#543C7D]', surface: 'bg-[#EAE4F2]/60',            swatch: 'bg-[#ECE6F3] ring-[#BDAAD6]' },
  slate:   { dot: 'bg-label-slate',    title: 'text-[#464D55]', surface: 'bg-[#E5E7EA]/60',            swatch: 'bg-[#E7E9EB] ring-[#B5BAC1]' },
}

export const COLUMN_COLOR_NAMES: Record<ColumnColor, string> = {
  neutral: 'Neutro',
  rose: 'Coral',
  amber: 'Âmbar',
  olive: 'Oliva',
  sage: 'Salva',
  sky: 'Céu',
  violet: 'Violeta',
  slate: 'Ardósia',
}

export const formatShortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export const formatDateTime = (ms: number) => {
  const d = new Date(ms)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return `hoje · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 1) return `ontem · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const isOverdue = (iso: string | null) => {
  if (!iso) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(`${iso}T00:00:00`)
  return d.getTime() < today.getTime()
}

export const formatRelative = (ms: number) => {
  const diff = Date.now() - ms
  const sec = Math.floor(diff / 1000)
  if (sec < 45) return 'agora'
  const min = Math.floor(sec / 60)
  if (min < 60) return `há ${min}min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `há ${hr}h`
  const days = Math.floor(hr / 24)
  if (days < 7) return `há ${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `há ${weeks}sem`
  const d = new Date(ms)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export const PRIORITY_ORDER: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

export const priorityStyles: Record<Priority, { label: string; bg: string; text: string; dot: string; short: string }> = {
  none:    { label: 'Sem prioridade', bg: 'bg-paper-sunken',     text: 'text-ink-muted',  dot: 'bg-ink-faint',    short: '—' },
  low:     { label: 'Baixa',          bg: 'bg-[#E7E9EB]',         text: 'text-[#464D55]',  dot: 'bg-label-slate',  short: 'P4' },
  medium:  { label: 'Média',          bg: 'bg-[#E1ECF6]',         text: 'text-[#315B84]',  dot: 'bg-label-sky',    short: 'P3' },
  high:    { label: 'Alta',           bg: 'bg-[#FAEEDB]',         text: 'text-[#8A5D15]',  dot: 'bg-label-amber',  short: 'P2' },
  urgent:  { label: 'Urgente',        bg: 'bg-[#FBEAED]',         text: 'text-[#8F3248]',  dot: 'bg-label-rose',   short: 'P1' },
}

export const isDueSoon = (iso: string | null) => {
  if (!iso) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(`${iso}T00:00:00`)
  const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 2
}
