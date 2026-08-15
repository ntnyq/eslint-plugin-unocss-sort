import { expect, it } from 'vitest'
import { removeDuplicateClasses } from '../src/features/duplicate-classes'

it('removes exact duplicates while preserving retained layout', () => {
  expect(removeDuplicateClasses('  flex  p-2 flex\n\tp-2  ')).toStrictEqual({
    duplicates: ['flex', 'p-2'],
    output: '  flex  p-2  ',
  })
})

it('leaves unique and whitespace-only inputs unchanged', () => {
  expect(removeDuplicateClasses(' flex\tp-2 ')).toStrictEqual({
    duplicates: [],
    output: ' flex\tp-2 ',
  })
  expect(removeDuplicateClasses(' \n ')).toStrictEqual({
    duplicates: [],
    output: ' \n ',
  })
})
