// Dynamic coordinate parser (extract numbers or map alphabet letter keys)
export function parseCoordinate(
  code: string | undefined | null,
): number | null {
  if (!code) return null;
  const match = code.match(/\d+/);
  if (match) return parseInt(match[0], 10);

  const letterMatch = code.match(/[A-Za-z]/);
  if (letterMatch) {
    const charCode = letterMatch[0].toUpperCase().charCodeAt(0);
    return charCode - 64; // A=1, B=2
  }
  return null;
}
