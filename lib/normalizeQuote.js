export function formatMoney(n) {
  return "$" + Number(n || 0).toFixed(2);
}

export function formatDate(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "";
  }
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;

  const cleaned =
    typeof value === "string"
      ? value.replace(/[$,]/g, "")
      : value;

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function pick(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

export function normalizeItem(item = {}, index = 0) {
  const qty = toNumber(item.qty, 1);
  const unitPrice = toNumber(item.unit, 0);

  const calculatedTotal = qty * unitPrice;

  return {
    ...item,

    // Your EstimateForm saves this as desc
    desc: item.desc || "",
    name: item.desc || `Item ${index + 1}`,

    // Your EstimateForm saves this as qty and unit
    qty,
    unit: unitPrice,
    unitPrice,

    // Pages can now safely use item.total
    total: calculatedTotal,
  };
}

export function normalizeLaborTask(task = {}, index = 0) {
  const hours = toNumber(task.hours, 0);
  const rate = toNumber(task.rate, 0);

  const calculatedTotal = hours * rate;

  return {
    ...task,

    // Your EstimateForm saves this as desc
    desc: task.desc || "",
    name: task.desc || `Labor ${index + 1}`,

    // Your EstimateForm saves this as hours and rate
    hours,
    rate,

    // Pages can now safely use task.total
    total: calculatedTotal,
  };
}

export function normalizeQuote(raw = {}) {
  const payload =
    raw.payload && typeof raw.payload === "object"
      ? raw.payload
      : raw;

  const items = Array.isArray(payload.items)
    ? payload.items.map(normalizeItem)
    : Array.isArray(raw.items)
      ? raw.items.map(normalizeItem)
      : [];

  const laborTasks = Array.isArray(payload.laborTasks)
    ? payload.laborTasks.map(normalizeLaborTask)
    : Array.isArray(raw.laborTasks)
      ? raw.laborTasks.map(normalizeLaborTask)
      : [];

  const rawTotals = payload.totals || raw.totals || {};

  const calculatedMaterialTotal = items.reduce(
    (sum, item) => sum + toNumber(item.total),
    0
  );

  const calculatedLaborTotal = laborTasks.reduce(
    (sum, task) => sum + toNumber(task.total),
    0
  );

  const materialTotal = toNumber(
    pick(rawTotals.materialTotal),
    calculatedMaterialTotal
  );

  const wasteAmount = toNumber(
    pick(rawTotals.wasteAmount),
    0
  );

  const laborTotal = toNumber(
    pick(rawTotals.laborTotal),
    calculatedLaborTotal
  );

  const overheadAmount = toNumber(
    pick(rawTotals.overheadAmount),
    0
  );

  const profitAmount = toNumber(
    pick(rawTotals.profitAmount),
    0
  );

  const taxAmount = toNumber(
    pick(rawTotals.taxAmount),
    0
  );

  const grandTotal = toNumber(
    pick(rawTotals.grandTotal, rawTotals.total),
    materialTotal +
      wasteAmount +
      laborTotal +
      overheadAmount +
      profitAmount +
      taxAmount
  );

  const id = String(
    pick(
      raw.id,
      raw.quoteId,
      payload.id,
      payload.quoteId,
      ""
    )
  );

  const estimateNumber =
    pick(
      raw.estimateNumber,
      payload.estimateNumber,
      id
    ) || "";

  const client =
    pick(
      raw.client,
      payload.client
    ) || "";

  const phone =
    pick(
      raw.phone,
      payload.phone
    ) || "";

  const customerEmail =
    pick(
      raw.customerEmail,
      payload.customerEmail,
      raw.email,
      payload.email
    ) || "";

  const jobAddress =
    pick(
      raw.jobAddress,
      payload.jobAddress,
      raw.address,
      payload.address
    ) || "";

  const status =
    pick(
      raw.status,
      payload.status
    ) || "Draft";

  const notes =
    pick(
      raw.notes,
      payload.notes
    ) || "";

  const startDate =
    pick(
      raw.startDate,
      payload.startDate
    ) || "";

  const dueDate =
    pick(
      raw.dueDate,
      payload.dueDate
    ) || "";

  const overheadPct = toNumber(
    pick(raw.overheadPct, payload.overheadPct),
    10
  );

  const profitPct = toNumber(
    pick(raw.profitPct, payload.profitPct),
    10
  );

  const wastePct = toNumber(
    pick(raw.wastePct, payload.wastePct),
    5
  );

  const taxRate = toNumber(
    pick(raw.taxRate, payload.taxRate),
    0
  );

  const companySettings =
    payload.companySettings ||
    raw.companySettings ||
    {};

  const normalized = {
    id,
    quoteId: id,
    estimateNumber,
    client,
    phone,
    customerEmail,
    email: customerEmail,
    jobAddress,
    status,
    notes,
    startDate,
    dueDate,
    overheadPct,
    profitPct,
    wastePct,
    taxRate,
    items,
    laborTasks,
    totals: {
      materialTotal,
      wasteAmount,
      laborTotal,
      overheadAmount,
      profitAmount,
      taxAmount,
      grandTotal,
    },
    companySettings,
    createdAt: pick(raw.createdAt, payload.createdAt, raw.created_at, payload.created_at) || "",
    updatedAt: pick(raw.updatedAt, payload.updatedAt, raw.updated_at, payload.updated_at) || "",
  };

  normalized.payload = {
    phone,
    customerEmail,
    jobAddress,
    estimateNumber,
    status,
    client,
    notes,
    items,
    laborTasks,
    overheadPct,
    profitPct,
    wastePct,
    taxRate,
    companySettings,
    totals: normalized.totals,
    startDate,
    dueDate,
  };

  return normalized;
}
