import { describe, expect, it } from 'vitest'
import { formatMoney } from './ui'

describe('INR money formatting', () => {
  it('formats zero and grouped amounts with Indian currency conventions', () => {
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

    expect(formatMoney(0)).toBe(formatter.format(0))
    expect(formatMoney(1_234_567.5)).toBe(formatter.format(1_234_567.5))
    expect(formatMoney(0)).toContain('₹')
    expect(formatMoney(0)).not.toContain('$')
  })
})
