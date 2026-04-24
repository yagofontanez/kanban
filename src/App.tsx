import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Board } from '@/components/Board'
import { Dashboard } from '@/components/Dashboard'
import { MyDay } from '@/components/MyDay'
import { CardModal } from '@/components/CardModal'
import { PomodoroWidget } from '@/components/PomodoroWidget'
import { useStore } from '@/store/useStore'

export default function App() {
  const view = useStore((s) => s.view ?? 'dashboard')
  const focusMode = useStore((s) => s.focusMode ?? false)
  const setFocusMode = useStore((s) => s.setFocusMode)
  const setActiveProject = useStore((s) => s.setActiveProject)
  const projects = useStore((s) => s.projects)
  const [openCardCtx, setOpenCardCtx] = useState<{ projectId: string; cardId: string } | null>(null)

  // Esc exits focus mode (unless a modal is open — it takes priority)
  useEffect(() => {
    if (!focusMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('.modal-open')) return
      setFocusMode(false, null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusMode, setFocusMode])

  const openCardInProject = (projectId: string, cardId: string) => {
    setActiveProject(projectId)
    setOpenCardCtx({ projectId, cardId })
  }

  const activeCard = openCardCtx
    ? projects[openCardCtx.projectId]?.cards[openCardCtx.cardId] ?? null
    : null
  const activeCardColumnId =
    openCardCtx && activeCard
      ? (() => {
          const p = projects[openCardCtx.projectId]
          if (!p) return ''
          for (const cid of p.columnOrder) {
            if (p.columns[cid]?.cardIds.includes(openCardCtx.cardId)) return cid
          }
          return p.columnOrder[0] ?? ''
        })()
      : ''

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {!focusMode && <Sidebar />}
      <main className="flex flex-1 flex-col overflow-hidden">
        {view === 'dashboard' && !focusMode ? (
          <Dashboard onOpenCard={openCardInProject} />
        ) : view === 'myday' && !focusMode ? (
          <MyDay onOpenCard={openCardInProject} />
        ) : (
          <Board />
        )}
      </main>

      {openCardCtx && activeCard && (
        <CardModal
          projectId={openCardCtx.projectId}
          card={activeCard}
          columnId={activeCardColumnId}
          onClose={() => setOpenCardCtx(null)}
        />
      )}

      <PomodoroWidget />
    </div>
  )
}
