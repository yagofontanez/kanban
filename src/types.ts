export type LabelColor =
  | 'rose'
  | 'amber'
  | 'olive'
  | 'sage'
  | 'sky'
  | 'violet'
  | 'slate'

export interface Label {
  id: string
  name: string
  color: LabelColor
}

export interface Comment {
  id: string
  body: string
  createdAt: number // epoch ms
}

export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface CardLink {
  id: string
  title: string
  url: string
}

export type ActivityType =
  | 'created'
  | 'title_changed'
  | 'description_changed'
  | 'moved'
  | 'label_added'
  | 'label_removed'
  | 'due_set'
  | 'due_removed'
  | 'priority_changed'
  | 'checklist_added'
  | 'checklist_removed'
  | 'checklist_toggled'
  | 'link_added'
  | 'link_removed'
  | 'comment_added'
  | 'pomodoro_completed'

export interface ActivityEvent {
  id: string
  type: ActivityType
  createdAt: number
  data?: Record<string, any>
}

export interface PomodoroSession {
  id: string
  completedAt: number
  durationMin: number
}

export interface Card {
  id: string
  title: string
  description: string
  labelIds: string[]
  priority: Priority
  dueDate: string | null
  checklist: ChecklistItem[]
  links: CardLink[]
  comments: Comment[]
  activity: ActivityEvent[]
  pomodoros?: PomodoroSession[]
  createdAt: number
}

export type ColumnColor =
  | 'neutral'
  | 'rose'
  | 'amber'
  | 'olive'
  | 'sage'
  | 'sky'
  | 'violet'
  | 'slate'

export interface Column {
  id: string
  name: string
  color: ColumnColor
  cardIds: string[]
  collapsed?: boolean
}

export interface Project {
  id: string
  name: string
  emoji: string
  columnOrder: string[]
  columns: Record<string, Column>
  cards: Record<string, Card>
  labels: Record<string, Label>
  labelOrder: string[]
  createdAt: number
}

export type AppView = 'dashboard' | 'myday' | 'project'

export interface AppState {
  projects: Record<string, Project>
  projectOrder: string[]
  activeProjectId: string | null
  view?: AppView
  focusMode?: boolean
  focusColumnId?: string | null
}
