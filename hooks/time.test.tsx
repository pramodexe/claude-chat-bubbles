import { expect, test } from 'claude-code/testing'

test('a typed prompt shows the time it was sent under its bubble', async ($, on) => {
  let stored: unknown
  on('store.get', () => ({ value: stored }))
  on('store.set', (_, e: any) => { stored = e.value; return { value: undefined } })
  on('clock.now', () => ({ value: Date.now() }))
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e); return <Text>engine</Text> })
  await $.session.append({
    message: { type: 'user', role: 'user', content: [{ type: 'text', text: 'hello' }] },
    door: 'prompt',
    origin: { kind: 'person' },
    uuid: 'aaaa-bbbb-cccc-dddd-123456789abc',
  } as any)
  const ui = await $.ui.mount({
    plugin: 'chat-bubbles', surface: 'terminal', component: 'UserMessage', requestId: 'aaaa-bbbb-cccc-dddd-000000000000',
    props: { text: 'hello', origin: { kind: 'composer' }, isExpanded: true },
  } as any)
  const t = await ui.find({ type: 'Text', text: /\d+:\d\d (AM|PM)/ })
  console.log('TIME:', t?.text)
  expect(t).toBeDefined()
  await ui.unmount()
})

test('no time for a prompt it never saw', async ($, on) => {
  let stored: unknown
  on('store.get', () => ({ value: stored }))
  on('store.set', (_, e: any) => { stored = e.value; return { value: undefined } })
  on('clock.now', () => ({ value: Date.now() }))
  const ui = await $.ui.mount({
    plugin: 'chat-bubbles', surface: 'terminal', component: 'UserMessage', requestId: 'old',
    props: { text: 'old one', origin: { kind: 'composer' }, isExpanded: true },
  } as any)
  expect(await ui.find({ type: 'Text', text: /(AM|PM)$/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /old one/ })).toBeDefined()
  await ui.unmount()
})
