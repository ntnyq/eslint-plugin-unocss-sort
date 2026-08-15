import type { Rule } from 'eslint'
import { describe, expect, it } from 'vitest'
import type { AstNode } from '../src/ast'
import { ruleOrder } from '../src/rules'

interface CapturedReport {
  replacement?: string
  sorted: string | undefined
}

function createRuleHarness(text: string): {
  listener: Rule.RuleListener
  reports: CapturedReport[]
} {
  const reports: CapturedReport[] = []
  const context = {
    filename: 'synthetic.ts',
    options: [],
    report(descriptor: Rule.ReportDescriptor) {
      const report: CapturedReport = {
        sorted: (descriptor.data as { sorted?: string } | undefined)?.sorted,
      }
      if (descriptor.fix) {
        const fix = descriptor.fix({
          replaceTextRange(_range: [number, number], replacement: string) {
            report.replacement = replacement
            return {} as Rule.Fix
          },
        } as Rule.RuleFixer)
        expect(fix).toBeDefined()
      }
      reports.push(report)
    },
    settings: {},
    sourceCode: {
      parserServices: {},
      text,
    },
  } as unknown as Rule.RuleContext

  return { listener: ruleOrder.create(context), reports }
}

function callListener(
  listener: Rule.RuleListener,
  selector: keyof Rule.RuleListener,
  node: AstNode,
): void {
  const callback = listener[selector]
  if (typeof callback !== 'function') {
    throw new TypeError(`Missing ${String(selector)} listener`)
  }
  // oxlint-disable-next-line promise/prefer-await-to-callbacks
  callback(node as never, {} as never, {} as never)
}

function literal(text: string): AstNode {
  return {
    range: [0, text.length],
    type: 'Literal',
    value: text.slice(1, -1),
  }
}

describe('rule expression branches', () => {
  it.each(['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression'])(
    'unwraps %s nodes',
    type => {
      const text = "'text-white flex'"
      const { listener, reports } = createRuleHarness(text)

      callListener(listener, 'VariableDeclarator', {
        id: { name: 'clsRoot', type: 'Identifier' },
        init: { expression: literal(text), type },
        type: 'VariableDeclarator',
      })

      expect(reports).toStrictEqual([
        { replacement: 'flex text-white', sorted: 'flex text-white' },
      ])
    },
  )

  it('unwraps a ChainExpression containing a helper call', () => {
    const text = "'text-white flex'"
    const { listener, reports } = createRuleHarness(text)
    const call: AstNode = {
      arguments: [literal(text)],
      callee: { name: 'clsx', type: 'Identifier' },
      type: 'CallExpression',
    }

    callListener(listener, 'VariableDeclarator', {
      id: { name: 'clsRoot', type: 'Identifier' },
      init: { expression: call, type: 'ChainExpression' },
      type: 'VariableDeclarator',
    })

    expect(reports).toHaveLength(1)
    expect(reports[0]?.sorted).toBe('flex text-white')
  })

  it('deduplicates a range reached by variable and call visitors', () => {
    const text = "'text-white flex'"
    const { listener, reports } = createRuleHarness(text)
    const call: AstNode = {
      arguments: [literal(text)],
      callee: { name: 'clsx', type: 'Identifier' },
      type: 'CallExpression',
    }

    callListener(listener, 'VariableDeclarator', {
      id: { name: 'clsRoot', type: 'Identifier' },
      init: call,
      type: 'VariableDeclarator',
    })
    callListener(listener, 'CallExpression', call)

    expect(reports).toHaveLength(1)
  })

  it('ignores literals without source ranges', () => {
    const { listener, reports } = createRuleHarness("'text-white flex'")

    callListener(listener, 'VariableDeclarator', {
      id: { name: 'clsRoot', type: 'Identifier' },
      init: { type: 'Literal', value: 'text-white flex' },
      type: 'VariableDeclarator',
    })

    expect(reports).toStrictEqual([])
  })
})
