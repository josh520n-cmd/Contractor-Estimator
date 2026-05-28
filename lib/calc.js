function computeTotals({ items = [], laborHours = 0, laborRate = 0, overheadPct = 0, profitPct = 0, wastePct = 0 }) {
  const materialTotal = (items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit) || 0), 0)
  const wasteAmount = (wastePct / 100) * materialTotal
  const laborTotal = (Number(laborHours) || 0) * (Number(laborRate) || 0)
  const directTotal = materialTotal + wasteAmount + laborTotal
  const overheadAmount = (overheadPct / 100) * directTotal
  const profitAmount = (profitPct / 100) * (directTotal + overheadAmount)
  const grandTotal = directTotal + overheadAmount + profitAmount
  return { materialTotal, wasteAmount, laborTotal, overheadAmount, profitAmount, grandTotal }
}

module.exports = { computeTotals }
