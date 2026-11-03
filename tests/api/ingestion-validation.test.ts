import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { validateEventPayload } from '../../src/server/validation/event-payload'
import { validateEvaluationPayload } from '../../src/server/validation/evaluation-payload'
import type { FieldError } from '../../src/server/validation/field-errors'

const validEvent = {
  providerEventId: 'evt-1',
  gameId: 'game-1',
  eventType: 'goal',
  period: '2',
  clockTime: '12:34',
}

const validEvaluation = {
  playerId: 'player-1',
  practiceDate: '2026-10-20',
  ratings: { skating: 4 },
}

function expectFieldErrorShape(errors: FieldError[]) {
  expect(errors.length).toBeGreaterThan(0)
  for (const e of errors) {
    expect(typeof e.field).toBe('string')
    expect(typeof e.code).toBe('string')
    expect(typeof e.message).toBe('string')
    expect(e.message.length).toBeGreaterThan(0)
    expect(Object.keys(e).sort()).toEqual(['code', 'field', 'message'])
  }
}

describe('contract paths and statuses exist in openapi/hockey-ingestion.yaml', () => {
  const yaml = readFileSync('openapi/hockey-ingestion.yaml', 'utf8')
  it('documents both POST paths with 201 and 422', () => {
    expect(yaml).toContain('/events:')
    expect(yaml).toContain('/evaluations:')
    expect(yaml).toContain('"201"')
    expect(yaml).toContain('"422"')
  })
})

describe('provider: events', () => {
  it('AC-1 valid event is accepted', () => {
    const result = validateEventPayload(validEvent)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.providerEventId).toBe('evt-1')
  })

  it('AC-2 missing period is rejected', () => {
    const { period: _omit, ...body } = validEvent
    const result = validateEventPayload(body)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const err = result.errors.find((e) => e.field === 'period')
      expect(err?.code).toBe('REQUIRED')
    }
  })

  it('AC-3 wrong type clockTime is rejected', () => {
    const result = validateEventPayload({ ...validEvent, clockTime: 1234 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const err = result.errors.find((e) => e.field === 'clockTime')
      expect(err?.code).toBe('INVALID_TYPE')
    }
  })

  it('AC-4 event errors use field, code, message', () => {
    const result = validateEventPayload({ gameId: 5 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expectFieldErrorShape(result.errors)
      const fields = result.errors.map((e) => e.field)
      expect(fields).toContain('providerEventId')
      expect(fields).toContain('gameId')
    }
  })

  it('rejects a body that is not an object', () => {
    const result = validateEventPayload('nope')
    expect(result.ok).toBe(false)
    if (!result.ok) expectFieldErrorShape(result.errors)
  })
})

describe('coach: evaluations', () => {
  it('AC-5 valid evaluation is accepted', () => {
    const result = validateEvaluationPayload(validEvaluation)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.ratings.skating).toBe(4)
  })

  it('AC-6 missing practiceDate is rejected', () => {
    const { practiceDate: _omit, ...body } = validEvaluation
    const result = validateEvaluationPayload(body)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const err = result.errors.find((e) => e.field === 'practiceDate')
      expect(err?.code).toBe('REQUIRED')
    }
  })

  it('AC-7 wrong type rating is rejected', () => {
    const result = validateEvaluationPayload({
      ...validEvaluation,
      ratings: { skating: 'high' },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const err = result.errors.find((e) => e.field === 'ratings.skating')
      expect(err?.code).toBe('INVALID_TYPE')
    }
  })

  it('rejects a rating outside 1 to 5', () => {
    const result = validateEvaluationPayload({
      ...validEvaluation,
      ratings: { skating: 9 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.find((e) => e.field === 'ratings.skating')?.code).toBe(
        'OUT_OF_RANGE',
      )
    }
  })

  it('AC-8 evaluation errors use field, code, message', () => {
    const result = validateEvaluationPayload({ comments: 7 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expectFieldErrorShape(result.errors)
      const fields = result.errors.map((e) => e.field)
      expect(fields).toContain('playerId')
      expect(fields).toContain('practiceDate')
      expect(fields).toContain('ratings')
    }
  })
})

describe('AC-9 server validates despite client flags', () => {
  it('ignores an isValid flag on events', () => {
    const { period: _omit, ...body } = validEvent
    const result = validateEventPayload({ ...body, isValid: true })
    expect(result.ok).toBe(false)
  })

  it('ignores an isValid flag on evaluations', () => {
    const { practiceDate: _omit, ...body } = validEvaluation
    const result = validateEvaluationPayload({ ...body, isValid: true })
    expect(result.ok).toBe(false)
  })

  it('event route imports and calls the event validator before the 201', () => {
    const src = readFileSync('src/routes/api/events.ts', 'utf8')
    expect(src).toContain('server/validation/event-payload')
    expect(src.indexOf('validateEventPayload(')).toBeGreaterThan(-1)
    expect(src.indexOf('validateEventPayload(')).toBeLessThan(src.indexOf('201'))
    expect(src).toContain('422')
  })

  it('evaluation route imports and calls the evaluation validator before the 201', () => {
    const src = readFileSync('src/routes/api/evaluations.ts', 'utf8')
    expect(src).toContain('server/validation/evaluation-payload')
    expect(src.indexOf('validateEvaluationPayload(')).toBeGreaterThan(-1)
    expect(src.indexOf('validateEvaluationPayload(')).toBeLessThan(src.indexOf('201'))
    expect(src).toContain('422')
  })
})