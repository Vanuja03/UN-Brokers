export function parsePagination(query: Record<string, unknown>, defaultLimit = 20) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function parseDateRange(from: unknown, to: unknown) {
  const range: { $gte?: Date; $lte?: Date } = {};
  if (typeof from === 'string' && from) {
    const start = new Date(from);
    if (!Number.isNaN(start.getTime())) range.$gte = start;
  }
  if (typeof to === 'string' && to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }
  return Object.keys(range).length ? range : undefined;
}
