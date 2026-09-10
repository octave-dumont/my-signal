export const PHRASE = "we're doing it"
const PHRASES = ["we're doing it", 'we are doing it']

// iOS curls apostrophes and people expand contractions: normalize before matching.
export function phraseOk(s: string): boolean {
  const norm = s.toLowerCase().replace(/[‘’‛′´`ʼ]/g, "'").replace(/\s+/g, ' ').trim()
  return PHRASES.includes(norm)
}
