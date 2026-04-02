// pages/api/test-connection.js — Diagnostics (authenticated)
import { testConnection } from '../../utils/googleSheets';
import { withAuth } from '../../utils/withAuth';

async function handler(req, res) {
  const result = await testConnection();
  if (result.success) {
    return res.status(200).json(result);
  }
  return res.status(500).json(result);
}

export default withAuth(handler);
