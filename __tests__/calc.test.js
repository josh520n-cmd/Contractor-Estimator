const { computeTotals } = require('../lib/calc')

test('compute totals basic', () => {
  const items = [{ desc: 'a', qty: 2, unit: 10 }, { desc: 'b', qty: 1, unit: 20 }]
  const totals = computeTotals({ items, laborHours: 5, laborRate: 20, overheadPct: 10, profitPct: 10, wastePct: 5 })
  expect(totals.materialTotal).toBeCloseTo(40)
  expect(totals.wasteAmount).toBeCloseTo(2)
  expect(totals.laborTotal).toBeCloseTo(100)
  // directTotal = 142 -> overhead 10% = 14.2 -> profit 10% of (142+14.2)=15.62
  expect(totals.overheadAmount).toBeCloseTo(14.2)
  expect(totals.profitAmount).toBeCloseTo(15.62, 2)
  expect(totals.grandTotal).toBeCloseTo(142 + 14.2 + 15.62, 2)
})
