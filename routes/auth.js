const express = require('express');
const router = express.Router();

// Simple auth endpoint for testing
router.post('/login', (req, res) => {
  res.json({
    success: true,
    message: 'Auth endpoint working',
    token: 'demo_token_123'
  });
});

module.exports = router;