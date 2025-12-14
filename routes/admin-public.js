const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

// Admin data file path
const adminDataPath = path.join(__dirname, '../admin-data.json');

// Helper function to read admin data
async function getAdminData() {
  try {
    return await fs.readJson(adminDataPath);
  } catch (error) {
    return { admin: null };
  }
}

// Admin login (public route)
router.post('/login', async (req, res) => {
  try {
    const adminData = await getAdminData();
    const { email, password } = req.body;

    if (email === adminData.admin.email && password === adminData.admin.password) {
      // Generate a simple admin token
      const token = Buffer.from(`${adminData.admin.email}:${adminData.admin.password}`).toString('base64');
      
      res.json({
        message: 'Admin login successful',
        token,
        admin: adminData.admin
      });
    } else {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Admin authentication failed' });
  }
});

module.exports = router;