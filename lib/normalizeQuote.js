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
  const qty = toNumber(pick(item.qty, item.quantity), 1);
  const unitPrice = toNumber(pick(item.unit, item.unitPrice, item.unit_price), 0);

  const explicitTotal = pick(item.total, item.lineTotal, item.amount);

  const total =
    explicitTotal !== undefined && explicitTotal !== null && explicitTotal !== ""
      ? toNumber(explicitTotal, 0)
      : qty * unitPrice;

  return {
    ...item,
    desc: pick(item.desc, item.description, item.name) || "",
    name: pick(item.desc, item.description, item.name) || `Item ${index + 1}`,
    qty,
    unit: unitPrice,
    unitPrice,
    total,
  };
}

export function normalizeLaborTask(task = {}, index = 0) {
  const hours = toNumber(pick(task.hours, task.qty), 0);
  const rate = toNumber(pick(task.rate, task.unit, task.unitPrice), 0);

  const explicitTotal = pick(task.total, task.lineTotal, task.amount);

  const total =
    explicitTotal !== undefined && explicitTotal !== null && explicitTotal !== ""
      ? toNumber(explicitTotal, 0)
      : hours * rate;

  return {
    ...task,
    desc: pick(task.desc, task.description, task.name) || "",
    name: pick(task.desc, task.description, task.name) || `Labor ${index + 1}`,
    hours,
    rate,
    total,
  };
}

export function normalizeQuote(raw = {}) {
  const payload =
    raw.payload && typeof raw.payload === "object"
      ? raw.payload
      : raw;

  const rawItems = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(raw.items)
      ? raw.items
      : [];

  const rawLaborTasks = Array.isArray(payload.laborTasks)
    ? payload.laborTasks
    : Array.isArray(raw.laborTasks)
      ? raw.laborTasks
      : [];

  const items = rawItems.map((item, index) => normalizeItem(item, index));
  const laborTasks = rawLaborTasks.map((task, index) =>
    normalizeLaborTask(task, index)
  );

  const rawTotals = payload.totals || raw.totals || {};

  const materialTotal = toNumber(
    pick(rawTotals.materialTotal),
    items.reduce((sum, item) => sum + toNumber(item.total), 0)
  );

  const laborTotal = toNumber(
    pick(rawTotals.laborTotal),
    laborTasks.reduce((sum, task) => sum + toNumber(task.total), 0)
  );

  const wasteAmount = toNumber(pick(rawTotals.wasteAmount), 0);
  const overheadAmount = toNumber(pick(rawTotals.overheadAmount), 0);
  const profitAmount = toNumber(pick(rawTotals.profitAmount), 0);
  const taxAmount = toNumber(pick(rawTotals.taxAmount), 0);

  const grandTotal = toNumber(
    pick(rawTotals.grandTotal, rawTotals.total),
    materialTotal +
      wasteAmount +
      laborTotal +
      overheadAmount +
      profitAmount +
      taxAmount
  );

  const id = String(pick(raw.id, raw.quoteId, payload.id, payload.quoteId, ""));

  const client = pick(raw.client, payload.client) || "";
  const customerEmail =
    pick(raw.customerEmail, payload.customerEmail, raw.email, payload.email) || "";

  const normalized = {
    id,
    quoteId: id,
    estimateNumber:
      pick(raw.estimateNumber, payload.estimateNumber, id) || "",
    client,
    phone: pick(raw.phone, payload.phone) || "",
    customerEmail,
    email: customerEmail,
    jobAddress:
      pick(raw.jobAddress, payload.jobAddress, raw.address, payload.address) || "",
    status: pick(raw.status, payload.status) || "Draft",
    notes: pick(raw.notes, payload.notes) || "",
    startDate: pick(raw.startDate, payload.startDate) || "",
    dueDate: pick(raw.dueDate, payload.dueDate) || "",
    overheadPct: toNumber(pick(raw.overheadPct, payload.overheadPct), 10),
    profitPct: toNumber(pick(raw.profitPct, payload.profitPct), 10),
    wastePct: toNumber(pick(raw.wastePct, payload.wastePct), 5),
    taxRate: toNumber(pick(raw.taxRate, payload.taxRate), 0),
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
    companySettings: payload.companySettings || raw.companySettings || {},
    createdAt:
      pick(raw.createdAt, payload.createdAt, raw.created_at, payload.created_at) ||
      "",
    updatedAt:
      pick(raw.updatedAt, payload.updatedAt, raw.updated_at, payload.updated_at) ||
      "",
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
    overheadPct: normalized.overheadPct,
    profitPct: normalized.profitPct,
    wastePct: normalized.wastePct,
    taxRate: normalized.taxRate,
    items: normalized.items,
    laborTasks: normalized.laborTasks,
    totals: normalized.totals,
    companySettings: normalized.companySettings,
  };

  return normalized;
}
