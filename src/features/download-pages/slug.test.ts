import test from 'node:test'
import assert from 'node:assert/strict'
import { suggestSlug, isValidSlug, titleFromFilename } from './slug.ts'

test('suggestSlug', () => assert.equal(suggestSlug('Fuentes LED — Ñandú 2026'), 'fuentes-led-nandu-2026'))

test('isValidSlug', () => {
  assert.ok(isValidSlug('fuentes'))
  assert.ok(isValidSlug('perfiles-led'))
  assert.ok(!isValidSlug('Fuentes'))
  assert.ok(!isValidSlug('a--b'))
  assert.ok(!isValidSlug('-a'))
  assert.ok(!isValidSlug(''))
})

test('titleFromFilename', () =>
  assert.equal(titleFromFilename('catalogo_fuentes-switching  2026.PDF'), 'catalogo fuentes switching 2026'))
