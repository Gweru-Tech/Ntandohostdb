const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs-extra');
const path = require('path');
const Site = require('../models/Site');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all sites for user
router.get('/', auth, async (req, res) => {
  try {
    const sites = await Site.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ sites });
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({ error: 'Failed to get sites' });
  }
});

// Create new site
router.post('/', auth, [
  body('name').isLength({ min: 1, max: 100 }).trim(),
  body('subdomain').isLength({ min: 3, max: 20 }).matches(/^[a-z0-9][a-z0-9-]{0,18}[a-z0-9]$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, subdomain } = req.body;

    // Check if subdomain is already taken
    const existingSite = await Site.findOne({ subdomain: subdomain.toLowerCase() });
    if (existingSite) {
      return res.status(400).json({ error: 'Subdomain already taken' });
    }

    // Create new site
    const site = new Site({
      name,
      subdomain: subdomain.toLowerCase(),
      userId: req.userId
    });

    await site.save();

    // Create site directory
    const sitePath = site.getSitePath();
    await fs.ensureDir(sitePath);

    // Create default index.html
    const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            color: white;
        }
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
        }
        p {
            font-size: 1.2em;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to ${name}</h1>
        <p>Your site is now live at ${subdomain}.ntando.app</p>
    </div>
</body>
</html>`;

    await fs.writeFile(path.join(sitePath, 'index.html'), defaultHtml);

    res.status(201).json({
      message: 'Site created successfully',
      site
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

// Get site details
router.get('/:id', auth, async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({ site });
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({ error: 'Failed to get site' });
  }
});

// Update site
router.put('/:id', auth, [
  body('name').optional().isLength({ min: 1, max: 100 }).trim(),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const site = await Site.findOne({ _id: req.params.id, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const { name, settings } = req.body;
    
    if (name) site.name = name;
    if (settings) site.settings = { ...site.settings, ...settings };

    await site.save();

    res.json({
      message: 'Site updated successfully',
      site
    });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// Delete site
router.delete('/:id', auth, async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Delete site directory
    const sitePath = site.getSitePath();
    if (await fs.pathExists(sitePath)) {
      await fs.remove(sitePath);
    }

    // Delete site from database
    await Site.findByIdAndDelete(req.params.id);

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

// Get site files
router.get('/:id/files', auth, async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sitePath = site.getSitePath();
    if (!await fs.pathExists(sitePath)) {
      return res.json({ files: [] });
    }

    const files = [];
    const items = await fs.readdir(sitePath, { withFileTypes: true });

    for (const item of items) {
      const filePath = path.join(sitePath, item.name);
      const stats = await fs.stat(filePath);
      
      files.push({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime,
        path: filePath
      });
    }

    res.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

module.exports = router;