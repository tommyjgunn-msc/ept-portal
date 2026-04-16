// pages/api/booking.js — Create test booking (authenticated)
import { createBooking, getAvailableDates } from '../../utils/googleSheets';
import { withAuth } from '../../utils/withAuth';
import { validateBookingData } from '../../utils/validation';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const bookingData = req.body;

  const validation = validateBookingData(bookingData);
  if (!validation.valid) {
    return res.status(400).json({
      message: 'Invalid booking data',
      errors: validation.errors,
    });
  }

  // Capacity validation
  const currentBookings = await getAvailableDates();
  const dateBookings = currentBookings[bookingData.selectedDate] || { withLaptop: 0, withoutLaptop: 0 };
  const totalBookings = dateBookings.withLaptop + dateBookings.withoutLaptop;

  if (totalBookings >= 100) {
    return res.status(400).json({
      message: 'This date is fully booked. Please select another date.',
    });
  }

  if (!bookingData.hasLaptop && dateBookings.withoutLaptop >= 30) {
    return res.status(400).json({
      message: 'No more spaces available for students without laptops on this date. Please bring your own laptop or select another date.',
    });
  }

  const result = await createBooking(bookingData);

  return res.status(200).json({
    message: 'Booking created successfully',
    booking: result,
  });
}

export default withAuth(handler);
