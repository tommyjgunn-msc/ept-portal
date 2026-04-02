// pages/api/bookings/count.js — Get booking counts per date (authenticated)
import { getBookingsCount } from '../../../utils/googleSheets';
import { withAuth } from '../../../utils/withAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const bookingCounts = await getBookingsCount();
  return res.status(200).json(bookingCounts);
}

export default withAuth(handler);
