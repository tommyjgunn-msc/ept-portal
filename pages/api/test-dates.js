// pages/api/test-dates.js — Serve available test dates (authenticated)
//
// Source of truth is the admin-managed TestDates tab (edited in admin-ept).
// If that tab is missing, empty, or unreadable we fall back to the legacy
// hardcoded list so the booking page can never go dark mid-migration.
import { regularDates } from '../../utils/testDatesConfig';
import { getTestDates } from '../../utils/googleSheets';
import { toDisplayDate } from '../../utils/dateUtils';
import { withAuth } from '../../utils/withAuth';

const CACHE_TTL = 60 * 1000; // dates change rarely; spare the Sheets read quota
let cache = { at: 0, data: null };

async function loadFromSheet() {
  if (cache.data && Date.now() - cache.at < CACHE_TTL) {
    return cache.data;
  }

  const rows = await getTestDates();
  const mapped = rows
    .map(row => ({
      // `date` stays the legacy display string — it is the join key that
      // existing Bookings rows and the capacity counts are keyed on.
      date: toDisplayDate(row.date_iso),
      date_iso: row.date_iso,
      venues: row.venues,
      capacity: row.capacity,
    }))
    .filter(row => row.date)
    .sort((a, b) => a.date_iso.localeCompare(b.date_iso));

  cache = { at: Date.now(), data: mapped };
  return mapped;
}

async function handler(req, res) {
  try {
    const fromSheet = await loadFromSheet();
    if (fromSheet.length > 0) {
      return res.status(200).json({ regularDates: fromSheet });
    }
  } catch (error) {
    console.error('[test-dates] TestDates read failed, serving legacy list:', error.message);
  }

  return res.status(200).json({ regularDates });
}

export default withAuth(handler);
