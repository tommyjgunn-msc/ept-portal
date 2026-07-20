// Render an ISO date (YYYY-MM-DD) in the legacy display format, e.g.
// '2026-08-21' -> 'Friday, 21 August'.
// This string is the join key for existing Bookings rows (Bookings!E), so the
// format must stay byte-identical to the old hardcoded list. Verified against
// every entry of the legacy testDatesConfig.
export function toDisplayDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      timeZone: 'UTC',
    })
    .replace(/^(\w+)\s/, '$1, ');
}

// Visibility test driven by a real ISO date rather than the yearless display
// string. Same rule as before (today .. today + 21 days), but without the
// current-year assumption that breaks dates in another year.
export function isDateVisibleISO(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;

  const today = new Date();
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const threeWeeksOut = startOfToday + 21 * 24 * 60 * 60 * 1000;

  return d.getTime() >= startOfToday && d.getTime() <= threeWeeksOut;
}

export function isWithinThreeWeeks(dateStr) {
  const currentYear = new Date().getFullYear();
  const [dayOfWeek, restOfDate] = dateStr.split(', ');
  const [day, month] = restOfDate.split(' ');
  const testDate = new Date(`${month} ${day}, ${currentYear}`);
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const threeWeeksFromNow = new Date();
  threeWeeksFromNow.setDate(now.getDate() + 21);
  threeWeeksFromNow.setHours(23, 59, 59, 999);
  
  return testDate >= now && testDate <= threeWeeksFromNow;
}

export function isFutureDate(dateStr) {
  const currentYear = new Date().getFullYear();
  
  const [dayOfWeek, restOfDate] = dateStr.split(', ');
  const [day, month] = restOfDate.split(' ');
  
  const testDate = new Date(`${month} ${day}, ${currentYear}`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return testDate >= now;
}