/**
 * Normaliza cor CSS para o formato rgb(r, g, b).
 *
 * Necessário porque happy-dom retorna estilos computados em hex (#rrggbb)
 * enquanto jsdom retornava rgb(). Garante asserções de cor agnósticas ao
 * ambiente de teste.
 *
 * @example
 * toRgb('#00ff41') // → 'rgb(0, 255, 65)'
 * toRgb('rgb(0, 255, 65)') // → 'rgb(0, 255, 65)'
 */
export function toRgb(color: string): string {
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    return `rgb(${r}, ${g}, ${b})`
  }
  // Normaliza espaços: 'rgb(0,0,0)' → 'rgb(0, 0, 0)'
  return color.replace(
    /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/,
    (_, r, g, b) => `rgb(${r}, ${g}, ${b})`
  )
}
