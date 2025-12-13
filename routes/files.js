const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const Site = require('../models/Site');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const site = await Site.findOne({ _id: req.params.siteId, userId: req.userId });
    if (!site) {
      return cb(new Error('Site not found'));
    }
    
    const sitePath = site.getSitePath();
    await fs.ensureDir(sitePath);
    cb(null, sitePath);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Upload files
router.post('/:siteId/upload', auth, upload.array('files', 10), async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      name: file.originalname,
      size: file.size,
      type: file.mimetype
    }));

    // Update site stats
    site.stats.storage += req.files.reduce((total, file) => total + file.size, 0);
    site.stats.lastDeployed = new Date();
    await site.save();

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Create/edit file content
router.post('/:siteId/files', auth, async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const { filename, content } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const sitePath = site.getSitePath();
    const filePath = path.join(sitePath, filename);

    // Create directory if it doesn't exist
    await fs.ensureDir(path.dirname(filePath));

    // Write file content
    await fs.writeFile(filePath, content || '');

    res.json({
      message: 'File saved successfully',
      filename
    });
  } catch (error) {
    console.error('Save file error:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Get file content
router.get('/:siteId/files/:filename', auth, async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sitePath = site.getSitePath();
    const filePath = path.join(sitePath, req.params.filename);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      // Return directory contents
      const items = await fs.readdir(filePath);
      const files = [];
      
      for (const item of items) {
        const itemPath = path.join(filePath, item);
        const itemStats = await fs.stat(itemPath);
        
        files.push({
          name: item,
          type: itemStats.isDirectory() ? 'directory' : 'file',
          size: itemStats.size,
          modified: itemStats.mtime
        });
      }
      
      return res.json({ files, path: req.params.filename });
    }

    // Return file content for text files
    const ext = path.extname(req.params.filename).toLowerCase();
    const textExtensions = ['.html', '.css', '.js', '.json', '.txt', '.md', '.xml', '.csv'];
    
    if (textExtensions.includes(ext)) {
      const content = await fs.readFile(filePath, 'utf8');
      res.json({ content, filename: req.params.filename, size: stats.size });
    } else {
      // For binary files, just return file info
      res.json({ 
        filename: req.params.filename, 
        size: stats.size,
        type: 'binary'
      });
    }
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Delete file
router.delete('/:siteId/files/:filename', auth, async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sitePath = site.getSitePath();
    const filePath = path.join(sitePath, req.params.filename);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = await fs.stat(filePath);
    await fs.remove(filePath);

    // Update site stats
    site.stats.storage = Math.max(0, site.stats.storage - stats.size);
    await site.save();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Rename file
router.put('/:siteId/files/:filename', auth, async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const { newFilename } = req.body;
    if (!newFilename) {
      return res.status(400).json({ error: 'New filename is required' });
    }

    const sitePath = site.getSitePath();
    const oldPath = path.join(sitePath, req.params.filename);
    const newPath = path.join(sitePath, newFilename);

    if (!await fs.pathExists(oldPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    await fs.move(oldPath, newPath);

    res.json({
      message: 'File renamed successfully',
      oldFilename: req.params.filename,
      newFilename
    });
  } catch (error) {
    console.error('Rename file error:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

module.exports = router;