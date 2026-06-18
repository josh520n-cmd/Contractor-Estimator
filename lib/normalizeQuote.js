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
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export function getItemName(item = {}) {
  return (
    item.name ||
    item.description ||
    item.desc ||
    item.label ||
    item.material ||
    "Item"
  );
}

export function getLaborName(task = {}) {
  return (
    task.name ||
    task.description ||
    task.desc ||
    task.task ||
    "Labor"
  );
}

export function normalizeItem(item = {}) {
  const qty = toNumber(
    firstDefined(item.qty, item.quantity),
    1
  );

  const unitPrice = toNumber(
    firstDefined(
      item.unitPrice,
      item.unit_price,
      item.unit,
      item.cost,
      item.rate,
      item.price
    ),
    0
  );

  const lineTotal = toNumber(
    firstDefined(
      item.total,
      item.lineTotal,
      item.line_total
    ),
    qty * unitPrice
  );

  return {
    ...item,
    name: getItemName(item),
    qty,
    unitPrice,
    total: lineTotal,
  };
}

export function normalizeLaborTask(task = {}) {
  const hours = toNumber(
    firstDefined(task.hours, task.qty, task.quantity),
    0
  );

  const rate = toNumber(
    firstDefined(
      task.rate,
      task.unitRate,
      task.unit_price,
      task.unit,
      task.cost,
      task.price
    ),
    0
  );

  const lineTotal = toNumber(
    firstDefined(
      task.total,
      task.lineTotal,
      task.line_total
    ),
    hours * rate
  );

  return {
    ...task,
    name: getLaborName(task),
    hours,
    rate,
    total: lineTotal,
  };
}

export function normalizeQuote(raw = {}) {
  const payload = raw.payload && typeof raw.payload === "object"
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

  const materialTotal = toNumber(
    firstDefined(rawTotals.materialTotal, rawTotals.materialsTotal),
    items.reduce((sum, item) => sum + toNumber(item.total), 0)
  );

  const laborTotal = toNumber(
    firstDefined(rawTotals.laborTotal),
    laborTasks.reduce((sum, task) => sum + toNumber(task.total), 0)
  );

  const wastePct = toNumber(firstDefined(payload.wastePct, raw.wastePct), 0);
  const overheadPct = toNumber(firstDefined(payload.overheadPct, raw.overheadPct), 0);
  const profitPct = toNumber(firstDefined(payload.profitPct, raw.profitPct), 0);
  const taxRate = toNumber(firstDefined(payload.taxRate, raw.taxRate), 0);

  const wasteAmount = toNumber(
    firstDefined(rawTotals.wasteAmount),
    materialTotal * (wastePct / 100)
  );

  const directTotal = materialTotal + wasteAmount + laborTotal;

  const overheadAmount = toNumber(
    firstDefined(rawTotals.overheadAmount),
    directTotal * (overheadPct / 100)
  );

  const profitAmount = toNumber(
    firstDefined(rawTotals.profitAmount),
    (directTotal + overheadAmount) * (profitPct / 100)
  );

  const subtotal = directTotal + overheadAmount + profitAmount;

  const taxAmount = toNumber(
    firstDefined(rawTotals.taxAmount),
    subtotal * (taxRate / 100)
  );

  const grandTotal = toNumber(
    firstDefined(rawTotals.grandTotal, rawTotals.total),
    subtotal + taxAmount
  );

  const id = String(firstDefined(raw.id, raw.quoteId, payload.id, payload.quoteId, ""));

  const estimateNumber =
    firstDefined(
      raw.estimateNumber,
      payload.estimateNumber,
      id
    ) || "";

  const client =
    firstDefined(
      raw.client,
      payload.client,
      raw.customerName,
      payload.customerName,
      raw.customer,
      payload.customer
    ) || "";

  const customerEmail =
    firstDefined(
      raw.customerEmail,
      payload.customerEmail,
      raw.email,
      payload.email
    ) || "";

  const jobAddress =
    firstDefined(
      raw.jobAddress,
      payload.jobAddress,
      raw.address,
      payload.address
    ) || "";

  const startDate =
    firstDefined(
      raw.startDate,
      payload.startDate,
      raw.scheduledStartDate,
      payload.scheduledStartDate
    ) || "";

  const dueDate =
    firstDefined(
      raw.dueDate,
      payload.dueDate,
      raw.endDate,
      payload.endDate,
      raw.scheduledEndDate,
      payload.scheduledEndDate
    ) || "";

  const normalized = {
    id,
    quoteId: id,
    estimateNumber,
    client,
    phone: firstDefined(raw.phone, payload.phone) || "",
    customerEmail,
    email: customerEmail,
    jobAddress,
    status: firstDefined(raw.status, payload.status) || "Draft",
    notes: firstDefined(raw.notes, payload.notes) || "",
    startDate,
    dueDate,
    createdAt: firstDefined(raw.createdAt, raw.created_at, payload.createdAt, payload.created_at) || "",
    updatedAt: firstDefined(raw.updatedAt, payload.updatedAt) || "",
    overheadPct,
    profitPct,
    wastePct,
    taxRate,
    items,
    laborTasks,
    totals: {
      materialTotal,
      laborTotal,
      wasteAmount,
      overheadAmount,
      profitAmount,
      taxAmount,
      grandTotal,
    },
    companySettings:
      payload.companySettings ||
      raw.companySettings ||
      {},
  };

  normalized.payload = {
    client: normalized.client,
    phone: normalized.phone,
    customerEmail: normalized.customerEmail,
    jobAddress: normalized.jobAddress,
    estimateNumber: normalized.estimateNumber,
    status: normalized.status,
    notes: normalized.notes,
    startDate: normalized.startDate,
    dueDate: normalized.dueDate,
    overheadPct,
    profitPct,
    wastePct,
    taxRate,
    items,
    laborTasks,
    totals: normalized.totals,
    companySettings: normalized.companySettings,
  };

  return normalized;
}
