const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Ping database with simple query
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;
