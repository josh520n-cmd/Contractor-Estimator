export function normalizeQuote(raw = {}) {
    const payload = raw.payload || raw;
  
    const items = Array.isArray(payload.items) ? payload.items : [];
    const laborTasks = Array.isArray(payload.laborTasks) ? payload.laborTasks : [];
  
    const totals = {
      materialTotal: Number(payload?.totals?.materialTotal || 0),
      laborTotal: Number(payload?.totals?.laborTotal || 0),
      overheadAmount: Number(payload?.totals?.overheadAmount || 0),
      wasteAmount: Number(payload?.totals?.wasteAmount || 0),
      taxAmount: Number(payload?.totals?.taxAmount || 0),
      grandTotal: Number(payload?.totals?.grandTotal || 0),
    };
  
    return {
      id: raw.id || "",
      client: raw.client || payload.client || "",
      jobAddress: raw.jobAddress || payload.jobAddress || "",
      customerEmail: raw.customerEmail || payload.customerEmail || "",
      status: raw.status || payload.status || "Draft",
      startDate: raw.startDate || payload.startDate || "",
      dueDate: raw.dueDate || payload.dueDate || "",
      estimateNumber: raw.estimateNumber || raw.id || "",
      notes: raw.notes || payload.notes || "",
      items,
      laborTasks,
      totals,
      companySettings: payload.companySettings || {},
    };
  }
