import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarTooltip } from './AvatarTooltip'
import { ThemeProvider } from '../contexts/ThemeContext'

const lines = [
  { label: 'role', value: 'architect' },
  { label: 'status', value: 'working', valueColor: '#00ff41' },
  { label: 'task', value: 'Revisando PR #44' },
]

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider isHackerMode={false}>{children}</ThemeProvider>
}

describe('AvatarTooltip', () => {
  it('tem role tooltip', () => {
    render(<AvatarTooltip lines={lines} />, { wrapper: Wrapper })
    expect(screen.getByRole('tooltip')).toBeTruthy()
  })

  it('exibe todas as linhas de conteúdo', () => {
    render(<AvatarTooltip lines={lines} />, { wrapper: Wrapper })
    expect(screen.getByText('architect')).toBeTruthy()
    expect(screen.getByText('working')).toBeTruthy()
    expect(screen.getByText('Revisando PR #44')).toBeTruthy()
  })

  it('exibe os labels de cada linha', () => {
    render(<AvatarTooltip lines={lines} />, { wrapper: Wrapper })
    expect(screen.getByText('role')).toBeTruthy()
    expect(screen.getByText('status')).toBeTruthy()
    expect(screen.getByText('task')).toBeTruthy()
  })

  it('renderiza com placement bottom', () => {
    const { container } = render(
      <AvatarTooltip lines={lines} placement="bottom" />,
      { wrapper: Wrapper },
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('renderiza no tema hacker', () => {
    render(
      <ThemeProvider isHackerMode={true}>
        <AvatarTooltip lines={lines} />
      </ThemeProvider>,
    )
    expect(screen.getByRole('tooltip')).toBeTruthy()
  })
})
