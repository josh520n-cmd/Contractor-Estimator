const { computeTotals } = require('../lib/calc')

test('compute totals basic with multiple labor tasks', () => {
  const items = [{ desc: 'a', qty: 2, unit: 10 }, { desc: 'b', qty: 1, unit: 20 }]
  const laborTasks = [
    { desc: 'Install', hours: 3, rate: 20 },
    { desc: 'Cleanup', hours: 2, rate: 15 }
  ]

  const totals = computeTotals({ items, laborTasks, overheadPct: 10, profitPct: 10, wastePct: 5 })
  expect(totals.materialTotal).toBeCloseTo(40)
  expect(totals.wasteAmount).toBeCloseTo(2)
  expect(totals.laborTotal).toBeCloseTo(90)
  // directTotal = 132 -> overhead 10% = 13.2 -> profit 10% of (132+13.2)=14.52
  expect(totals.overheadAmount).toBeCloseTo(13.2)
  expect(totals.profitAmount).toBeCloseTo(14.52, 2)
  expect(totals.grandTotal).toBeCloseTo(132 + 13.2 + 14.52, 2)
})
