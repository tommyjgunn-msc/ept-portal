// pages/api/test-dates.js — Serve available test dates (authenticated)
import { regularDates } from '../../utils/testDatesConfig';
import { withAuth } from '../../utils/withAuth';

function handler(req, res) {
  return res.status(200).json({ regularDates });
}

export default withAuth(handler);
