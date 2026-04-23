import { Sidebar } from '@/components/Sidebar'
import { Board } from '@/components/Board'

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Board />
      </main>
    </div>
  )
}
