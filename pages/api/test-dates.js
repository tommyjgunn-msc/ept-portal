import { regularDates, refugeeDates } from '../../utils/testDatesConfig';

export default function handler(req, res) {
  try {
    // Return both regular and refugee dates
    res.status(200).json({ regularDates, refugeeDates });
  } catch (error) {
    console.error('Error fetching test dates:', error);
    res.status(500).json({ message: 'Failed to fetch test dates' });
  }
}