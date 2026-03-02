import { useSocket } from './hooks/useSocket'
import { OfficeCanvas } from './components/OfficeCanvas'

export function App() {
  const { status } = useSocket()

  return (
    <>
      <OfficeCanvas connectionStatus={status} />
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: '#374151',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        v0.2 — office map
      </div>
    </>
  )
}
