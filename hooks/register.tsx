import type { Register, UiPressArgument } from 'claude-code'

// WhatsApp dark-mode "sent" bubble colours
const BUBBLE = '#005C4B'
const TEXT = '#E9EDEF'
const MUTED = '#8FB8AE'

// Only the person's own prompts become bubbles; notifications,
// teammate messages and plugin prompts keep the normal look.
const OWN = new Set(['composer', 'bridge', 'sdk'])

const COPY = '⧉ copy'

// A short stable id per prompt, so every bubble's copy button has its own key.
const hash = (s: string) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

const len = (s: string) => [...s].length

// Word-wrap to `width` columns, breaking words longer than a line.
const wrap = (text: string, width: number): string[] => {
  const out: string[] = []
  for (const para of text.replace(/\t/g, '  ').split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      let w = word
      while (len(w) > width) {
        if (line) { out.push(line); line = '' }
        const chars = [...w]
        out.push(chars.slice(0, width).join(''))
        w = chars.slice(width).join('')
      }
      if (!line) line = w
      else if (len(line) + 1 + len(w) <= width) line += ' ' + w
      else { out.push(line); line = w }
    }
    out.push(line)
  }
  return out
}

export const register: Register = on => {
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    if (e.surface !== 'terminal' || !OWN.has(e.props.origin.kind) || e.props.from) {
      return next(e)
    }

    const { Box, Text, Button } = $.ui.resolve(e)
    const text = e.props.text.trimEnd()

    // Padding: 1 row top/bottom and 2 columns left/right. A terminal cell is
    // about twice as tall as it is wide, so these look equal on screen.
    const PAD_X = 2
    const columns = e.viewport?.columns ?? 80
    const maxInner = Math.max(12, Math.floor(columns * 0.75) - PAD_X * 2 - 4)
    const lines = wrap(text, maxInner)
    const inner = Math.max(len(COPY), ...lines.map(len))
    const width = inner + PAD_X * 2
    const pad = ' '.repeat(PAD_X)

    const copy = async (press: UiPressArgument) => {
      const r = await $.ui.copy({ text, surface: press.surface })
      $.ui.toast(r.isCopied ? 'Prompt copied' : `Couldn't copy (${r.reason})`)
    }

    const fill = (s: string) => pad + s + ' '.repeat(inner - len(s)) + pad
    const blank = ' '.repeat(width)

    return (
      <Box flexDirection="row" justifyContent="flex-end" width="100%" marginTop={1}>
        <Box flexDirection="column">
          {/* top padding row */}
          <Text backgroundColor={BUBBLE}>{blank}</Text>
          {lines.map((l, i) => (
            <Text key={`l${i}`} color={TEXT} backgroundColor={BUBBLE}>{fill(l)}</Text>
          ))}
          {/* copy button, bottom-right inside the bubble */}
          <Box flexDirection="row">
            <Text backgroundColor={BUBBLE}>{' '.repeat(Math.max(0, width - len(COPY) - PAD_X))}</Text>
            <Button key={`copy-${hash(text)}`} plain label={COPY} onPress={copy}>
              <Text color={MUTED} backgroundColor={BUBBLE}>{COPY}</Text>
            </Button>
            <Text backgroundColor={BUBBLE}>{pad}</Text>
          </Box>
          {/* bottom padding row */}
          <Text backgroundColor={BUBBLE}>{blank}</Text>
        </Box>
        {/* tail, top-right, as in the first version */}
        <Box flexDirection="column" alignSelf="flex-start">
          <Text color={BUBBLE}>◤</Text>
        </Box>
      </Box>
    )
  })
}
