/**
 * Normalizes a CSS color to the canonical `rgb(r, g, b)` format.
 *
 * Needed because happy-dom returns computed styles as hex (#rrggbb)
 * while jsdom returned rgb(). Ensures color assertions are agnostic to
 * the test environment.
 *
 * Supported formats:
 * - `#rgb`              → rgb(r, g, b)
 * - `#rrggbb`           → rgb(r, g, b)
 * - `rgb(r, g, b)`      → rgb(r, g, b)  (commas with or without space)
 * - `rgb(r g b)`        → rgb(r, g, b)  (modern CSS without commas)
 *
 * @example
 * toRgb('#00ff41')       // → 'rgb(0, 255, 65)'
 * toRgb('rgb(0,0,0)')    // → 'rgb(0, 0, 0)'
 * toRgb('rgb(0 0 0)')    // → 'rgb(0, 0, 0)'
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
  // Covers rgb(r,g,b) with commas AND modern rgb(r g b) without commas
  return color.replace(
    /rgb\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)\s*\)/,
    (_, r, g, b) => `rgb(${r}, ${g}, ${b})`
  )
}
