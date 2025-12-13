const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for hosted sites
app.use('/static', express.static(path.join(__dirname, 'hosted-sites')));

// Ensure hosted-sites directory exists
fs.ensureDirSync(path.join(__dirname, 'hosted-sites'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ntando-hosting', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Custom domain middleware
app.use(async (req, res, next) => {
  const host = req.headers.host;
  const subdomain = host.split('.')[0];
  
  // Skip for main domain and API routes
  if (host.includes('localhost') || host.includes('onrender.com') || req.path.startsWith('/api/')) {
    return next();
  }
  
  try {
    // Check if this is a hosted site
    const Site = require('./models/Site');
    const site = await Site.findOne({ subdomain: subdomain.toLowerCase(), active: true });
    
    if (site) {
      const sitePath = path.join(__dirname, 'hosted-sites', site.userId.toString(), site._id.toString());
      
      if (await fs.pathExists(sitePath)) {
        // Serve the index.html file for the hosted site
        const indexPath = path.join(sitePath, 'index.html');
        if (await fs.pathExists(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
    }
    
    // If no site found, serve default landing page
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } catch (error) {
    console.error('Error serving custom domain:', error);
    next();
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/domains', require('./routes/domains'));
app.use('/api/files', require('./routes/files'));

// Main application routes
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Ntando Hosting Platform running on port ${PORT}`);
  console.log(`Access your platform at: http://localhost:${PORT}`);
});

module.exports = app;