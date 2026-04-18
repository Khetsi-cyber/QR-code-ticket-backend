import { processEmailQueue } from '../email-service.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Optional protection for manual calls; Vercel Cron can also call this path.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization || '';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }

  try {
    await processEmailQueue();
    return res.status(200).json({
      success: true,
      message: 'Email queue processed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
