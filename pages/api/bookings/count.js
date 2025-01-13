// pages/api/bookings/count.js
import { getBookingsCount } from '../../../utils/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const bookingCounts = await getBookingsCount();
    res.status(200).json(bookingCounts);
  } catch (error) {
    console.error('Error fetching booking counts:', error);
    res.status(500).json({ message: 'Failed to fetch booking counts' });
  }
}