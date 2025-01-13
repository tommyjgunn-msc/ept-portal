// pages/api/booking.js
import { createBooking } from '../../utils/googleSheets';  // Add this import at the top

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Booking API called with:', req.body);
    const bookingData = req.body;

    // Debug log
    console.log('Checking fields:', {
      name: !!bookingData.name,
      email: !!bookingData.email,
      eptId: !!bookingData.eptId,
      selectedDate: !!bookingData.selectedDate,
      isRefugee: bookingData.isRefugee,
      hasLaptop: bookingData.hasLaptop,
      confirmedAttendance: bookingData.confirmedAttendance
    });

    // Validate required fields
    const requiredFields = ['name', 'email', 'eptId', 'selectedDate', 'isRefugee'];
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

    // Create the booking
    console.log('All validation passed, creating booking...');
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