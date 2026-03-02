import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpeechBubble } from './SpeechBubble'

describe('SpeechBubble', () => {
  it('não renderiza nada quando text é null', () => {
    const { container } = render(<SpeechBubble text={null} color="#8b5cf6" />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza o texto quando fornecido', () => {
    render(<SpeechBubble text="Implementando feature" color="#8b5cf6" />)
    expect(screen.getByText('Implementando feature')).toBeTruthy()
  })

  it('trunca texto maior que 40 chars com reticências', () => {
    const longText = 'A'.repeat(50)
    render(<SpeechBubble text={longText} color="#8b5cf6" />)
    const el = screen.getByText(`${'A'.repeat(40)}…`)
    expect(el).toBeTruthy()
  })

  it('não trunca texto com exatamente 40 chars', () => {
    const text = 'A'.repeat(40)
    render(<SpeechBubble text={text} color="#8b5cf6" />)
    expect(screen.getByText(text)).toBeTruthy()
  })

  it('renderiza a seta apontando para baixo', () => {
    render(<SpeechBubble text="teste" color="#8b5cf6" />)
    expect(screen.getByTestId('speech-arrow')).toBeTruthy()
  })
})
