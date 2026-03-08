import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { None, Some } from '@roxdavirox/fp-core/option'
import { SpeechBubble } from './SpeechBubble'

describe('SpeechBubble', () => {
  it('renders nothing when text is None', () => {
    const { container } = render(<SpeechBubble text={None} color="#8b5cf6" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the text when provided', () => {
    render(<SpeechBubble text={Some('Implementing feature')} color="#8b5cf6" />)
    expect(screen.getByText('Implementing feature')).toBeTruthy()
  })

  it('truncates text longer than 40 chars with ellipsis', () => {
    const longText = 'A'.repeat(50)
    render(<SpeechBubble text={Some(longText)} color="#8b5cf6" />)
    const el = screen.getByText(`${'A'.repeat(40)}…`)
    expect(el).toBeTruthy()
  })

  it('does not truncate text with exactly 40 chars', () => {
    const text = 'A'.repeat(40)
    render(<SpeechBubble text={Some(text)} color="#8b5cf6" />)
    expect(screen.getByText(text)).toBeTruthy()
  })

  it('renders the downward-pointing arrow', () => {
    render(<SpeechBubble text={Some('test')} color="#8b5cf6" />)
    expect(screen.getByTestId('speech-arrow')).toBeTruthy()
  })
})
