import { useSocket } from './hooks/useSocket'
import { OfficeCanvas } from './components/OfficeCanvas'

export function App() {
  const { status } = useSocket()

  return <OfficeCanvas connectionStatus={status} />
}
