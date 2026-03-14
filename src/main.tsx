import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

if (import.meta.env.DEV && !import.meta.env.VITE_MAGO_BACKEND_URL) {
  console.warn('[mago-office] VITE_MAGO_BACKEND_URL não definido — usando http://localhost:3002')
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
