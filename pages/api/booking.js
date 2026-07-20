// pages/api/booking.js — Create test booking (authenticated)
import { createBooking, getAvailableDates, getTestDates } from '../../utils/googleSheets';
import { toDisplayDate } from '../../utils/dateUtils';
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

  // Per-date limits come from the admin-managed TestDates tab so that editing a
  // date's capacity is actually enforced here, not just reflected in the UI.
  // Falls back to the historical 100 total / 30 without-laptop — which is also
  // exactly what the legacy 70 + 30 configuration worked out to.
  let maxTotal = 100;
  let maxWithoutLaptop = 30;
  try {
    const configured = (await getTestDates())
      .find(entry => toDisplayDate(entry.date_iso) === bookingData.selectedDate);
    if (configured) {
      maxTotal = configured.capacity.withLaptop + configured.capacity.withoutLaptop;
      maxWithoutLaptop = configured.capacity.withoutLaptop;
    }
  } catch (error) {
    console.error('[booking] TestDates lookup failed, using default capacity:', error.message);
  }

  if (totalBookings >= maxTotal) {
    return res.status(400).json({
      message: 'This date is fully booked. Please select another date.',
    });
  }

  if (!bookingData.hasLaptop && dateBookings.withoutLaptop >= maxWithoutLaptop) {
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
