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

// When each prompt was sent, kept in the plugin's store so the times survive
// restarts and resumed sessions. Capped to the newest MAX.
const SENT_KEY = 'sent'
const MAX = 3000
type Sent = Record<string, number>
let sent: Sent | undefined

// The transcript row's id and the id its drawing carries share only their
// first four groups (the drawing's last group is zeroed), so key by those.
const idKey = (id: string) => id.split('-').slice(0, 4).join('-')

const normalize = (raw: unknown): Sent => {
  const out: Sent = {}
  for (const [id, t] of Object.entries((raw ?? {}) as Sent)) out[idKey(id)] = t
  return out
}

const loadSent = async (get: () => Promise<unknown>) => (sent ??= normalize(await get()))

const two = (n: number) => String(n).padStart(2, '0')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "3:15 PM" today, "14 Nov, 3:15 PM" on another day.
const formatTime = (ms: number, nowMs: number) => {
  const d = new Date(ms)
  const now = new Date(nowMs)
  const h = d.getHours()
  const time = `${h % 12 || 12}:${two(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  return sameDay ? time : `${d.getDate()} ${MONTHS[d.getMonth()]}, ${time}`
}

export const register: Register = on => {
  // Note the time each typed prompt is saved to the conversation.
  on('session.append', { door: 'prompt' }, async ($, e, next) => {
    const result = await next(e)
    if (!e.agentId) {
      // Re-read first: other Claude Code windows write the same store.
      const table = (sent = { ...normalize(await $.store.get(SENT_KEY)), ...(sent ?? {}) })
      table[idKey(e.uuid)] = await $.clock.now()
      const ids = Object.keys(table)
      if (ids.length > MAX) for (const id of ids.slice(0, ids.length - MAX)) delete table[id]
      await $.store.set(SENT_KEY, table)
      $.ui.invalidate('ui.render')
    }
    return result
  })

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
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
    const inner = Math.max(1, ...lines.map(len))
    const width = inner + PAD_X * 2
    const pad = ' '.repeat(PAD_X)

    const copy = async (press: UiPressArgument) => {
      const r = await $.ui.copy({ text, surface: press.surface })
      $.ui.toast(r.isCopied ? 'Prompt copied' : `Couldn't copy (${r.reason})`)
    }

    const fill = (s: string) => pad + s + ' '.repeat(inner - len(s)) + pad
    const blank = ' '.repeat(width)

    const at = (await loadSent(() => $.store.get(SENT_KEY)))[idKey(e.requestId)]
    const time = at === undefined ? undefined : formatTime(at, await $.clock.now())

    return (
      <Box flexDirection="column" width="100%" marginTop={1}>
      <Box flexDirection="row" justifyContent="flex-end" width="100%">
        <Box flexDirection="column">
          {/* top padding row */}
          <Text backgroundColor={BUBBLE}>{blank}</Text>
          {lines.map((l, i) => (
            <Text key={`l${i}`} color={TEXT} backgroundColor={BUBBLE}>{fill(l)}</Text>
          ))}
          {/* bottom padding row */}
          <Text backgroundColor={BUBBLE}>{blank}</Text>
        </Box>
        {/* tail, top-right, as in the first version */}
        <Box flexDirection="column" alignSelf="flex-start">
          <Text color={BUBBLE}>◤</Text>
        </Box>
      </Box>
      {/* under the bubble, outside it: time sent, then the copy button */}
      <Box flexDirection="row" justifyContent="flex-end" width="100%" paddingRight={1}>
        {time && <Text dimColor>{time}  </Text>}
        <Button key={`copy-${hash(text)}`} plain label={COPY} onPress={copy}>
          <Text color={MUTED}>{COPY}</Text>
        </Button>
      </Box>
      </Box>
    )
  })
}
