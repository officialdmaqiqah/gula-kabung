const PAGE_SIZE = 1000;

// Mengambil semua baris walaupun server membatasi jumlah baris per permintaan.
export async function fetchAll(buildQuery) {
  const rows = [];
  for (;;) {
    const { data, error } = await buildQuery()
      .order('id')
      .range(rows.length, rows.length + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    if (data.length === 0) return { data: rows, error: null };
    rows.push(...data);
  }
}
