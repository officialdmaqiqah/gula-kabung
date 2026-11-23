const wibFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export const todayWIB = (now = new Date()) => wibFormatter.format(now);

export const currentMonthWIB = (now = new Date()) => todayWIB(now).substring(0, 7);

// Minggu dimulai hari Minggu, sama seperti filter laporan sebelumnya.
export const startOfWeekWIB = (now = new Date()) => {
  const date = new Date(`${todayWIB(now)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().split('T')[0];
};
