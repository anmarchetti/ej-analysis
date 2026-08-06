const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body if not parsed by Vercel helper
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'custom-microapp-mapping.json');
    
    // Ensure data folder exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
    return res.status(200).json({ status: 'success', message: 'Mapping saved' });
  } catch (err) {
    console.error('Failed to write mapping file:', err);
    // On Vercel, the filesystem is read-only, so we return success to prevent UI errors,
    // but include a warning status.
    return res.status(200).json({ 
      status: 'warning', 
      message: 'Running on Serverless (Not persisted to disk)', 
      error: err.message 
    });
  }
};
