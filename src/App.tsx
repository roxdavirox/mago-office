export function App() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 12,
        background: '#0d1117',
        color: '#00ff41',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <span style={{ fontSize: 32 }}>⌂</span>
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.1em' }}>MAGO OFFICE</span>
      <span style={{ fontSize: 11, opacity: 0.5 }}>v0.1 — scaffold</span>
    </div>
  )
}
