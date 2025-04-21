import express from 'express';
import OSS from 'ali-oss';

const router = express.Router();

// Initialize OSS client
let ossClient = null;
try {
  const endpoint = process.env.ALIBABA_OSS_ENDPOINT || `${process.env.ALIBABA_OSS_REGION}-internal.aliyuncs.com`;
  console.log('Initializing OSS client with config:', {
    region: process.env.ALIBABA_OSS_REGION,
    bucket: process.env.ALIBABA_OSS_BUCKET,
    endpoint: endpoint
  });
  
  ossClient = new OSS({
    region: process.env.ALIBABA_OSS_REGION,
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
    bucket: process.env.ALIBABA_OSS_BUCKET,
    endpoint: endpoint,
    secure: true
  });
  console.log('OSS client initialized successfully');
} catch (error) {
  console.error('Failed to initialize OSS client:', error);
}

// Save robot
router.post('/robots', async (req, res) => {
  try {
    if (!ossClient) {
      return res.status(503).json({ error: 'Storage service unavailable' });
    }

    const { userId, robot } = req.body;
    if (!userId || !robot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const key = `users/${userId}/robots/${robot.id}.json`;
    await ossClient.put(key, Buffer.from(JSON.stringify(robot)));

    res.json({ success: true, message: 'Robot saved successfully' });
  } catch (error) {
    console.error('Failed to save robot:', error);
    res.status(500).json({ error: 'Failed to save robot' });
  }
});

// Get all robots for user
router.get('/robots/:userId', async (req, res) => {
  try {
    if (!ossClient) {
      return res.status(503).json({ error: 'Storage service unavailable' });
    }

    const { userId } = req.params;
    const prefix = `users/${userId}/robots/`;
    
    const result = await ossClient.list({
      prefix,
      'max-keys': 1000
    });

    const robots = await Promise.all(
      result.objects.map(async (obj) => {
        const data = await ossClient.get(obj.name);
        return JSON.parse(data.content.toString());
      })
    );

    res.json(robots);
  } catch (error) {
    console.error('Failed to get robots:', error);
    res.status(500).json({ error: 'Failed to get robots' });
  }
});

// Get single robot by ID
router.get('/robots/:userId/:robotId', async (req, res) => {
  try {
    if (!ossClient) {
      return res.status(503).json({ error: 'Storage service unavailable' });
    }

    const { userId, robotId } = req.params;
    const key = `users/${userId}/robots/${robotId}.json`;
    
    try {
      const result = await ossClient.get(key);
      const robot = JSON.parse(result.content.toString());
      res.json(robot);
    } catch (err) {
      if (err.code === 'NoSuchKey') {
        return res.status(404).json({ error: 'Robot not found' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Failed to get robot:', error);
    res.status(500).json({ error: 'Failed to get robot' });
  }
});

// Delete robot
router.delete('/robots/:userId/:robotId', async (req, res) => {
  try {
    if (!ossClient) {
      return res.status(503).json({ error: 'Storage service unavailable' });
    }

    const { userId, robotId } = req.params;
    const key = `users/${userId}/robots/${robotId}.json`;
    
    await ossClient.delete(key);
    
    res.json({ success: true, message: 'Robot deleted successfully' });
  } catch (error) {
    console.error('Failed to delete robot:', error);
    res.status(500).json({ error: 'Failed to delete robot' });
  }
});

export default router;