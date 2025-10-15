// pages/api/booking.js - WITH CAPACITY VALIDATION
import { createBooking, getAvailableDates } from '../../utils/googleSheets'; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Booking API called with:', req.body);
    const bookingData = req.body;

    console.log('Checking fields:', {
      name: !!bookingData.name,
      email: !!bookingData.email,
      eptId: !!bookingData.eptId,
      selectedDate: !!bookingData.selectedDate,
      hasLaptop: bookingData.hasLaptop,
      confirmedAttendance: bookingData.confirmedAttendance
    });

    const requiredFields = ['name', 'email', 'eptId', 'selectedDate'];
    const missingFields = requiredFields.filter(field => {
      const value = bookingData[field];
      const isMissing = value === undefined || value === null || value === '';
      if (isMissing) {
        console.log(`Field ${field} is missing, value:`, value);
      }
      return isMissing;
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        receivedData: bookingData
      });
    }

    // ========== CAPACITY VALIDATION - THIS WAS MISSING ==========
    console.log('Checking capacity limits for date:', bookingData.selectedDate);
    
    const currentBookings = await getAvailableDates();
    const dateBookings = currentBookings[bookingData.selectedDate] || { withLaptop: 0, withoutLaptop: 0 };
    const totalBookings = dateBookings.withLaptop + dateBookings.withoutLaptop;
    
    console.log('Current bookings for date:', {
      date: bookingData.selectedDate,
      withLaptop: dateBookings.withLaptop,
      withoutLaptop: dateBookings.withoutLaptop,
      total: totalBookings
    });
    
    // Check total capacity (100 max per day)
    if (totalBookings >= 100) {
      console.log('REJECTED: Date is fully booked');
      return res.status(400).json({ 
        message: 'This date is fully booked. Please select another date.' 
      });
    }
    
    // Check no-laptop capacity (30 max per day)
    if (!bookingData.hasLaptop && dateBookings.withoutLaptop >= 30) {
      console.log('REJECTED: No laptop spots are full');
      return res.status(400).json({ 
        message: 'No more spaces available for students without laptops on this date. Please bring your own laptop or select another date.' 
      });
    }
    
    console.log('Capacity validation PASSED');
    // ========== END CAPACITY VALIDATION ==========

    console.log('Creating booking...');
    const result = await createBooking(bookingData);
    console.log('Booking created:', result);

    return res.status(200).json({ 
      message: 'Booking created successfully',
      booking: result 
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ 
      message: 'Failed to create booking',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
