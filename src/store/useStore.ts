import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  AppState,
  ActivityEvent,
  ActivityType,
  Card,
  CardLink,
  ChecklistItem,
  Column,
  ColumnColor,
  Comment,
  Label,
  LabelColor,
  Priority,
  Project,
} from '@/types'
import { uid } from '@/lib/uid'
import { seed } from '@/lib/seed'

interface Actions {
  // Projects
  createProject: (name: string, emoji?: string) => string
  renameProject: (projectId: string, name: string) => void
  setProjectEmoji: (projectId: string, emoji: string) => void
  deleteProject: (projectId: string) => void
  setActiveProject: (projectId: string) => void
  reorderProjects: (fromId: string, toId: string) => void

  // Columns
  createColumn: (projectId: string, name: string) => void
  renameColumn: (projectId: string, columnId: string, name: string) => void
  setColumnColor: (projectId: string, columnId: string, color: ColumnColor) => void
  deleteColumn: (projectId: string, columnId: string) => void
  moveColumn: (projectId: string, activeId: string, overId: string) => void

  // Cards
  createCard: (projectId: string, columnId: string, title: string) => string
  updateCard: (projectId: string, cardId: string, patch: Partial<Omit<Card, 'id' | 'comments' | 'createdAt' | 'labelIds'>>) => void
  deleteCard: (projectId: string, columnId: string, cardId: string) => void
  moveCard: (
    projectId: string,
    args: { activeCardId: string; sourceColId: string; destColId: string; destIndex: number },
  ) => void

  // Labels (project-level presets)
  createLabel: (projectId: string, name: string, color: LabelColor) => string
  updateLabel: (projectId: string, labelId: string, patch: Partial<Omit<Label, 'id'>>) => void
  deleteLabel: (projectId: string, labelId: string) => void
  toggleCardLabel: (projectId: string, cardId: string, labelId: string) => void

  // Priority
  setCardPriority: (projectId: string, cardId: string, priority: Priority) => void

  // Checklist
  addChecklistItem: (projectId: string, cardId: string, text: string) => string
  updateChecklistItemText: (projectId: string, cardId: string, itemId: string, text: string) => void
  toggleChecklistItem: (projectId: string, cardId: string, itemId: string) => void
  removeChecklistItem: (projectId: string, cardId: string, itemId: string) => void

  // Links
  addCardLink: (projectId: string, cardId: string, title: string, url: string) => string
  updateCardLink: (projectId: string, cardId: string, linkId: string, patch: Partial<Omit<CardLink, 'id'>>) => void
  removeCardLink: (projectId: string, cardId: string, linkId: string) => void

  // Comments
  addComment: (projectId: string, cardId: string, body: string) => void
  deleteComment: (projectId: string, cardId: string, commentId: string) => void

  // Debug / reset
  resetToSeed: () => void
}

type Store = AppState & Actions

const initial = seed()

// Helpers — pure functions that produce a new Card with an appended activity event
const mkEvent = (type: ActivityType, data?: Record<string, any>): ActivityEvent => ({
  id: uid('evt'),
  type,
  createdAt: Date.now(),
  data,
})

const withActivity = (card: Card, type: ActivityType, data?: Record<string, any>): Card => ({
  ...card,
  activity: [...(card.activity ?? []), mkEvent(type, data)],
})

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...initial,

      // ── Projects ────────────────────────────────────────────────
      createProject: (name, emoji = '✦') => {
        const id = uid('prj')
        const proj: Project = {
          id,
          name: name.trim() || 'Sem título',
          emoji,
          columnOrder: [],
          columns: {},
          cards: {},
          labels: {},
          labelOrder: [],
          createdAt: Date.now(),
        }
        // Seed a friendly set of preset labels
        const presets: { name: string; color: LabelColor }[] = [
          { name: 'urgente',  color: 'rose' },
          { name: 'bug',      color: 'amber' },
          { name: 'feature',  color: 'sky' },
          { name: 'design',   color: 'violet' },
          { name: 'pronto',   color: 'sage' },
        ]
        for (const preset of presets) {
          const lid = uid('lbl')
          proj.labels[lid] = { id: lid, ...preset }
          proj.labelOrder.push(lid)
        }
        // Start with three pleasant defaults
        const colA = uid('col')
        const colB = uid('col')
        const colC = uid('col')
        proj.columns[colA] = { id: colA, name: 'A fazer', color: 'slate', cardIds: [] }
        proj.columns[colB] = { id: colB, name: 'Em progresso', color: 'sky', cardIds: [] }
        proj.columns[colC] = { id: colC, name: 'Concluído', color: 'sage', cardIds: [] }
        proj.columnOrder = [colA, colB, colC]

        set((s) => ({
          projects: { ...s.projects, [id]: proj },
          projectOrder: [...s.projectOrder, id],
          activeProjectId: id,
        }))
        return id
      },

      renameProject: (projectId, name) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          return {
            projects: { ...s.projects, [projectId]: { ...p, name: name.trim() || p.name } },
          }
        }),

      setProjectEmoji: (projectId, emoji) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          return { projects: { ...s.projects, [projectId]: { ...p, emoji } } }
        }),

      deleteProject: (projectId) =>
        set((s) => {
          if (!s.projects[projectId]) return s
          const projects = { ...s.projects }
          delete projects[projectId]
          const projectOrder = s.projectOrder.filter((id) => id !== projectId)
          const activeProjectId =
            s.activeProjectId === projectId ? projectOrder[0] ?? null : s.activeProjectId
          return { projects, projectOrder, activeProjectId }
        }),

      setActiveProject: (projectId) =>
        set((s) => (s.projects[projectId] ? { activeProjectId: projectId } : s)),

      reorderProjects: (fromId, toId) =>
        set((s) => {
          const from = s.projectOrder.indexOf(fromId)
          const to = s.projectOrder.indexOf(toId)
          if (from === -1 || to === -1 || from === to) return s
          const next = [...s.projectOrder]
          next.splice(from, 1)
          next.splice(to, 0, fromId)
          return { projectOrder: next }
        }),

      // ── Columns ─────────────────────────────────────────────────
      createColumn: (projectId, name) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const id = uid('col')
          const col: Column = {
            id,
            name: name.trim() || 'Nova coluna',
            color: 'neutral',
            cardIds: [],
          }
          const next: Project = {
            ...p,
            columns: { ...p.columns, [id]: col },
            columnOrder: [...p.columnOrder, id],
          }
          return { projects: { ...s.projects, [projectId]: next } }
        }),

      renameColumn: (projectId, columnId, name) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const col = p.columns[columnId]
          if (!col) return s
          const next: Project = {
            ...p,
            columns: { ...p.columns, [columnId]: { ...col, name: name.trim() || col.name } },
          }
          return { projects: { ...s.projects, [projectId]: next } }
        }),

      setColumnColor: (projectId, columnId, color) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const col = p.columns[columnId]
          if (!col) return s
          const next: Project = {
            ...p,
            columns: { ...p.columns, [columnId]: { ...col, color } },
          }
          return { projects: { ...s.projects, [projectId]: next } }
        }),

      deleteColumn: (projectId, columnId) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const col = p.columns[columnId]
          if (!col) return s
          const columns = { ...p.columns }
          delete columns[columnId]
          const cards = { ...p.cards }
          for (const cid of col.cardIds) delete cards[cid]
          const next: Project = {
            ...p,
            columns,
            cards,
            columnOrder: p.columnOrder.filter((id) => id !== columnId),
          }
          return { projects: { ...s.projects, [projectId]: next } }
        }),

      moveColumn: (projectId, activeId, overId) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const from = p.columnOrder.indexOf(activeId)
          const to = p.columnOrder.indexOf(overId)
          if (from === -1 || to === -1 || from === to) return s
          const order = [...p.columnOrder]
          order.splice(from, 1)
          order.splice(to, 0, activeId)
          return {
            projects: { ...s.projects, [projectId]: { ...p, columnOrder: order } },
          }
        }),

      // ── Cards ───────────────────────────────────────────────────
      createCard: (projectId, columnId, title) => {
        const id = uid('card')
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const col = p.columns[columnId]
          if (!col) return s
          const card: Card = {
            id,
            title: title.trim() || 'Sem título',
            description: '',
            labelIds: [],
            priority: 'none',
            dueDate: null,
            checklist: [],
            links: [],
            comments: [],
            activity: [mkEvent('created')],
            createdAt: Date.now(),
          }
          const next: Project = {
            ...p,
            cards: { ...p.cards, [id]: card },
            columns: {
              ...p.columns,
              [columnId]: { ...col, cardIds: [...col.cardIds, id] },
            },
          }
          return { projects: { ...s.projects, [projectId]: next } }
        })
        return id
      },

      updateCard: (projectId, cardId, patch) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          let merged: Card = { ...card, ...patch }

          if (patch.title !== undefined && patch.title !== card.title) {
            merged = withActivity(merged, 'title_changed', { from: card.title, to: patch.title })
          }
          if (patch.description !== undefined && patch.description !== card.description) {
            merged = withActivity(merged, 'description_changed')
          }
          if (patch.dueDate !== undefined && patch.dueDate !== card.dueDate) {
            merged = patch.dueDate
              ? withActivity(merged, 'due_set', { iso: patch.dueDate })
              : withActivity(merged, 'due_removed')
          }

          return {
            projects: {
              ...s.projects,
              [projectId]: { ...p, cards: { ...p.cards, [cardId]: merged } },
            },
          }
        }),

      deleteCard: (projectId, columnId, cardId) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const col = p.columns[columnId]
          if (!col) return s
          const cards = { ...p.cards }
          delete cards[cardId]
          const next: Project = {
            ...p,
            cards,
            columns: {
              ...p.columns,
              [columnId]: { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) },
            },
          }
          return { projects: { ...s.projects, [projectId]: next } }
        }),

      moveCard: (projectId, { activeCardId, sourceColId, destColId, destIndex }) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const source = p.columns[sourceColId]
          const dest = p.columns[destColId]
          if (!source || !dest) return s

          if (sourceColId === destColId) {
            const order = source.cardIds.filter((id) => id !== activeCardId)
            const clamped = Math.max(0, Math.min(destIndex, order.length))
            order.splice(clamped, 0, activeCardId)
            return {
              projects: {
                ...s.projects,
                [projectId]: {
                  ...p,
                  columns: { ...p.columns, [sourceColId]: { ...source, cardIds: order } },
                },
              },
            }
          }

          const sourceIds = source.cardIds.filter((id) => id !== activeCardId)
          const destIds = [...dest.cardIds]
          const clamped = Math.max(0, Math.min(destIndex, destIds.length))
          destIds.splice(clamped, 0, activeCardId)

          const movingCard = p.cards[activeCardId]
          const nextCards = movingCard
            ? {
                ...p.cards,
                [activeCardId]: withActivity(movingCard, 'moved', {
                  fromName: source.name,
                  toName: dest.name,
                }),
              }
            : p.cards

          return {
            projects: {
              ...s.projects,
              [projectId]: {
                ...p,
                cards: nextCards,
                columns: {
                  ...p.columns,
                  [sourceColId]: { ...source, cardIds: sourceIds },
                  [destColId]: { ...dest, cardIds: destIds },
                },
              },
            },
          }
        }),

      // ── Labels ──────────────────────────────────────────────────
      createLabel: (projectId, name, color) => {
        const id = uid('lbl')
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const lbl: Label = { id, name: name.trim() || 'Sem título', color }
          const next: Project = {
            ...p,
            labels: { ...p.labels, [id]: lbl },
            labelOrder: [...p.labelOrder, id],
          }
          return { projects: { ...s.projects, [projectId]: next } }
        })
        return id
      },

      updateLabel: (projectId, labelId, patch) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const lbl = p.labels[labelId]
          if (!lbl) return s
          const merged: Label = { ...lbl, ...patch, name: (patch.name ?? lbl.name).trim() || lbl.name }
          return {
            projects: {
              ...s.projects,
              [projectId]: { ...p, labels: { ...p.labels, [labelId]: merged } },
            },
          }
        }),

      deleteLabel: (projectId, labelId) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          if (!p.labels[labelId]) return s
          const labels = { ...p.labels }
          delete labels[labelId]
          const cards: Record<string, Card> = {}
          for (const [cid, c] of Object.entries(p.cards)) {
            cards[cid] = c.labelIds.includes(labelId)
              ? { ...c, labelIds: c.labelIds.filter((id) => id !== labelId) }
              : c
          }
          return {
            projects: {
              ...s.projects,
              [projectId]: {
                ...p,
                labels,
                labelOrder: p.labelOrder.filter((id) => id !== labelId),
                cards,
              },
            },
          }
        }),

      toggleCardLabel: (projectId, cardId, labelId) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          const label = p.labels[labelId]
          if (!card || !label) return s
          const has = card.labelIds.includes(labelId)
          const labelIds = has
            ? card.labelIds.filter((id) => id !== labelId)
            : [...card.labelIds, labelId]
          const nextCard = withActivity(
            { ...card, labelIds },
            has ? 'label_removed' : 'label_added',
            { labelName: label.name, labelColor: label.color },
          )
          return {
            projects: {
              ...s.projects,
              [projectId]: {
                ...p,
                cards: { ...p.cards, [cardId]: nextCard },
              },
            },
          }
        }),

      // ── Priority / Checklist / Links ───────────────────────────
      setCardPriority: (projectId, cardId, priority) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card || card.priority === priority) return s
          const next = withActivity({ ...card, priority }, 'priority_changed', {
            from: card.priority,
            to: priority,
          })
          return {
            projects: {
              ...s.projects,
              [projectId]: { ...p, cards: { ...p.cards, [cardId]: next } },
            },
          }
        }),

      addChecklistItem: (projectId, cardId, text) => {
        const id = uid('chk')
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          const t = text.trim()
          if (!t) return s
          const item: ChecklistItem = { id, text: t, done: false }
          const next = withActivity(
            { ...card, checklist: [...card.checklist, item] },
            'checklist_added',
            { text: t },
          )
          return {
            projects: {
              ...s.projects,
              [projectId]: { ...p, cards: { ...p.cards, [cardId]: next } },
            },
          }
        })
        return id
      },

      updateChecklistItemText: (projectId, cardId, itemId, text) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          const t = text.trim()
          if (!t) return s
          const checklist = card.checklist.map((it) =>
            it.id === itemId ? { ...it, text: t } : it,
          )
          return {
            projects: {
              ...s.projects,
              [projectId]: {
                ...p,
                cards: { ...p.cards, [cardId]: { ...card, checklist } },
              },
            },
          }
        }),

      toggleChecklistItem: (projectId, cardId, itemId) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          const target = card.checklist.find((it) => it.id === itemId)
          if (!target) return s
          const checklist = card.checklist.map((it) =>
            it.id === itemId ? { ...it, done: !it.done } : it,
          )
          const next = withActivity({ ...card, checklist }, 'checklist_toggled', {
            text: target.text,
            done: !target.done,
          })
          return {
            projects: {
              ...s.projects,
              [projectId]: { ...p, cards: { ...p.cards, [cardId]: next } },
            },
          }
        }),

      removeChecklistItem: (projectId, cardId, itemId) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          const target = card.checklist.find((it) => it.id === itemId)
          if (!target) return s
          const checklist = card.checklist.filter((it) => it.id !== itemId)
          const next = withActivity({ ...card, checklist }, 'checklist_removed', {
            text: target.text,
          })
          return {
            projects: {
              ...s.projects,
              [projectId]: { ...p, cards: { ...p.cards, [cardId]: next } },
            },
          }
        }),

      addCardLink: (projectId, cardId, title, url) => {
        const id = uid('lnk')
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          const u = url.trim()
          if (!u) return s
          const link: CardLink = { id, title: title.trim() || u, url: u }
          const next = withActivity(
            { ...card, links: [...card.links, link] },
            'link_added',
            { title: link.title, url: link.url },
          )
          return {
            projects: {
              ...s.projects,
              [projectId]: { ...p, cards: { ...p.cards, [cardId]: next } },
            },
          }
        })
        return id
      },

      updateCardLink: (projectId, cardId, linkId, patch) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          const links = card.links.map((l) =>
            l.id === linkId ? { ...l, ...patch } : l,
          )
          return {
            projects: {
              ...s.projects,
              [projectId]: {
                ...p,
                cards: { ...p.cards, [cardId]: { ...card, links } },
              },
            },
          }
        }),

      removeCardLink: (projectId, cardId, linkId) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          const target = card.links.find((l) => l.id === linkId)
          if (!target) return s
          const links = card.links.filter((l) => l.id !== linkId)
          const next = withActivity({ ...card, links }, 'link_removed', { title: target.title })
          return {
            projects: {
              ...s.projects,
              [projectId]: { ...p, cards: { ...p.cards, [cardId]: next } },
            },
          }
        }),

      // ── Comments ────────────────────────────────────────────────
      addComment: (projectId, cardId, body) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          const c: Comment = { id: uid('cmt'), body: body.trim(), createdAt: Date.now() }
          if (!c.body) return s
          const next = withActivity(
            { ...card, comments: [...card.comments, c] },
            'comment_added',
          )
          return {
            projects: {
              ...s.projects,
              [projectId]: {
                ...p,
                cards: { ...p.cards, [cardId]: next },
              },
            },
          }
        }),

      deleteComment: (projectId, cardId, commentId) =>
        set((s) => {
          const p = s.projects[projectId]
          if (!p) return s
          const card = p.cards[cardId]
          if (!card) return s
          return {
            projects: {
              ...s.projects,
              [projectId]: {
                ...p,
                cards: {
                  ...p.cards,
                  [cardId]: {
                    ...card,
                    comments: card.comments.filter((c) => c.id !== commentId),
                  },
                },
              },
            },
          }
        }),

      resetToSeed: () => set(() => ({ ...seed() })),
    }),
    {
      name: 'kanban.v1',
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        projectOrder: state.projectOrder,
        activeProjectId: state.activeProjectId,
      }),
      migrate: (persisted: any, _fromVersion) => {
        if (!persisted || typeof persisted !== 'object') return persisted
        const projects = persisted.projects ?? {}
        for (const p of Object.values<any>(projects)) {
          if (!p.labels) p.labels = {}
          if (!p.labelOrder) p.labelOrder = []
          for (const c of Object.values<any>(p.cards ?? {})) {
            if (!Array.isArray(c.labelIds)) c.labelIds = []
            // Legacy inline label → project label
            if (c.labelColor && c.labelColor !== 'none') {
              const wantName = (c.labelText ?? '').trim()
              let existing = Object.values<any>(p.labels).find(
                (l: any) => l.color === c.labelColor && (l.name ?? '') === wantName,
              )
              if (!existing) {
                const lid = uid('lbl')
                existing = { id: lid, name: wantName || c.labelColor, color: c.labelColor }
                p.labels[lid] = existing
                p.labelOrder.push(lid)
              }
              if (!c.labelIds.includes(existing.id)) c.labelIds.push(existing.id)
            }
            delete c.labelColor
            delete c.labelText
            // v4 defaults
            if (!c.priority) c.priority = 'none'
            if (!Array.isArray(c.checklist)) c.checklist = []
            if (!Array.isArray(c.links)) c.links = []
            if (!Array.isArray(c.activity)) {
              c.activity = [{ id: uid('evt'), type: 'created', createdAt: c.createdAt ?? Date.now() }]
            }
          }
        }
        return persisted
      },
    },
  ),
)

// Selectors
export const useActiveProject = (): Project | null => {
  return useStore((s) => (s.activeProjectId ? s.projects[s.activeProjectId] ?? null : null))
}
