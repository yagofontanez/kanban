import type { AppState } from '@/types'

export const seed = (): AppState => ({
  projects: {},
  projectOrder: [],
  activeProjectId: null,
  view: 'dashboard',
})
