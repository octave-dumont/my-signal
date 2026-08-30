import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fold, nextState, type DayEvent } from './day.ts'

const H = 3600_000
const t0 = 1_700_000_000_000

test('closed day splits awake time between signal and noise', () => {
  const events: DayEvent[] = [
    { t: t0, type: 'wake' },
    { t: t0 + 1 * H, type: 'toggle' },
    { t: t0 + 3 * H, type: 'toggle' },
    { t: t0 + 4 * H, type: 'sleep' },
  ]
  const r = fold(events, t0 + 10 * H)
  assert.equal(r.awakeMs, 4 * H)
  assert.equal(r.signalMs, 2 * H)
  assert.equal(r.ratio, 0.5)
  assert.equal(r.state, 'asleep')
})

test('open day is measured up to now', () => {
  const events: DayEvent[] = [
    { t: t0, type: 'wake' },
    { t: t0 + 1 * H, type: 'toggle' },
  ]
  const r = fold(events, t0 + 2 * H)
  assert.equal(r.awakeMs, 2 * H)
  assert.equal(r.signalMs, 1 * H)
  assert.equal(r.state, 'signal')
})

test('rewake after sleep accumulates both stretches', () => {
  const events: DayEvent[] = [
    { t: t0, type: 'wake' },
    { t: t0 + 1 * H, type: 'sleep' },
    { t: t0 + 2 * H, type: 'wake' },
    { t: t0 + 2 * H + 30 * 60_000, type: 'toggle' },
    { t: t0 + 3 * H, type: 'sleep' },
  ]
  const r = fold(events, t0 + 9 * H)
  assert.equal(r.awakeMs, 2 * H)
  assert.equal(r.signalMs, 30 * 60_000)
})

test('illegal events in the log are ignored', () => {
  const events: DayEvent[] = [
    { t: t0, type: 'toggle' },
    { t: t0 + 1 * H, type: 'wake' },
    { t: t0 + 1 * H, type: 'wake' },
    { t: t0 + 2 * H, type: 'sleep' },
    { t: t0 + 2 * H, type: 'sleep' },
  ]
  const r = fold(events, t0 + 9 * H)
  assert.equal(r.awakeMs, 1 * H)
  assert.equal(r.signalMs, 0)
})

test('nextState refuses what the day cannot do', () => {
  assert.equal(nextState('asleep', 'wake'), 'noise')
  assert.equal(nextState('asleep', 'toggle'), null)
  assert.equal(nextState('asleep', 'sleep'), null)
  assert.equal(nextState('noise', 'wake'), null)
  assert.equal(nextState('noise', 'toggle'), 'signal')
  assert.equal(nextState('signal', 'toggle'), 'noise')
  assert.equal(nextState('signal', 'sleep'), 'asleep')
})
