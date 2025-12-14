const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs-extra');
const path = require('path');
const auth = require('../middleware/auth');

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

// Helper function to write admin data
async function saveAdminData(data) {
  await fs.writeJson(adminDataPath, data, { spaces: 2 });
}

// Admin login (no auth required)
router.post('/login', async (req, res) => {
  try {
    const adminData = await getAdminData();
    const { email, password } = req.body;

    if (email === adminData.admin.email && password === adminData.admin.password) {
      // Generate a simple admin token
      const token = Buffer.from(`${req.admin.email}:${req.admin.password}`).toString('base64');
      
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

// Admin middleware to check admin privileges
const requireAdmin = async (req, res, next) => {
  try {
    const adminData = await getAdminData();
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No admin token provided' });
    }

    // Simple token verification for demo
    const decoded = Buffer.from(token, 'base64').toString();
    const [email, password] = decoded.split(':');
    
    if (email === adminData.admin.email && password === adminData.admin.password) {
      req.admin = adminData.admin;
      next();
    } else {
      return res.status(403).json({ error: 'Invalid admin token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

// Admin dashboard (mock data)
router.get('/dashboard', async (req, res) => {
  try {
    // Mock dashboard data for demonstration
    const data = {
      stats: {
        totalUsers: 15,
        totalSites: 42,
        totalStorage: 2048576000, // ~2GB
        planStats: [
          { _id: 'free', count: 10 },
          { _id: 'pro', count: 4 },
          { _id: 'enterprise', count: 1 }
        ]
      },
      recentUsers: [
        { username: 'john_doe', email: 'john@example.com', createdAt: new Date() },
        { username: 'jane_smith', email: 'jane@example.com', createdAt: new Date(Date.now() - 86400000) },
        { username: 'mike_wilson', email: 'mike@example.com', createdAt: new Date(Date.now() - 172800000) },
        { username: 'sarah_jones', email: 'sarah@example.com', createdAt: new Date(Date.now() - 259200000) },
        { username: 'tom_brown', email: 'tom@example.com', createdAt: new Date(Date.now() - 345600000) }
      ],
      recentSites: [
        { name: 'My Portfolio', subdomain: 'john-portfolio', userId: { username: 'john_doe' }, createdAt: new Date() },
        { name: 'Business Site', subdomain: 'company-main', userId: { username: 'jane_smith' }, createdAt: new Date(Date.now() - 86400000) },
        { name: 'Blog Platform', subdomain: 'tech-blog', userId: { username: 'mike_wilson' }, createdAt: new Date(Date.now() - 172800000) },
        { name: 'E-commerce', subdomain: 'shop-online', userId: { username: 'sarah_jones' }, createdAt: new Date(Date.now() - 259200000) },
        { name: 'Landing Page', subdomain: 'marketing', userId: { username: 'tom_brown' }, createdAt: new Date(Date.now() - 345600000) }
      ]
    };

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Apply admin middleware to protected routes
router.use(requireAdmin);

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    // Mock user data for demonstration
    const users = [
      {
        _id: '1',
        username: 'john_doe',
        email: 'john@example.com',
        plan: 'free',
        role: 'user',
        createdAt: new Date(),
        siteCount: 1,
        storageUsed: 1048576
      },
      {
        _id: '2',
        username: 'jane_smith',
        email: 'jane@example.com',
        plan: 'pro',
        role: 'user',
        createdAt: new Date(Date.now() - 86400000),
        siteCount: 5,
        storageUsed: 52428800
      },
      {
        _id: '3',
        username: 'mike_wilson',
        email: 'mike@example.com',
        plan: 'enterprise',
        role: 'user',
        createdAt: new Date(Date.now() - 172800000),
        siteCount: 15,
        storageUsed: 1073741824
      }
    ];

    res.json({
      users,
      pagination: {
        current: 1,
        total: 1,
        count: users.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create new user
router.post('/users', [
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('plan').optional().isIn(['free', 'pro', 'enterprise'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, plan = 'free' } = req.body;

    // Mock user creation for demonstration
    const newUser = {
      _id: Date.now().toString(),
      username,
      email,
      plan,
      role: 'user',
      createdAt: new Date()
    };

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:userId', [
  body('username').optional().isLength({ min: 3, max: 30 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('plan').optional().isIn(['free', 'pro', 'enterprise']),
  body('password').optional().isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const updates = req.body;

    // Mock user update for demonstration
    const updatedUser = {
      _id: userId,
      username: updates.username || 'user_updated',
      email: updates.email || 'updated@example.com',
      plan: updates.plan || 'free',
      role: 'user',
      updatedAt: new Date()
    };

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Mock user deletion for demonstration
    res.json({
      message: 'User deleted successfully',
      deletedSitesCount: Math.floor(Math.random() * 10)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user details with full statistics
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Mock user details for demonstration
    const userData = {
      user: {
        _id: userId,
        username: 'demo_user',
        email: 'demo@example.com',
        plan: 'pro',
        role: 'user',
        createdAt: new Date()
      },
      statistics: {
        totalSites: 5,
        totalStorage: 52428800,
        totalVisits: 1000,
        activeSites: 4
      },
      sites: [
        { name: 'My Portfolio', subdomain: 'portfolio', stats: { storage: 1048576 }, createdAt: new Date(), active: true },
        { name: 'Business Site', subdomain: 'business', stats: { storage: 2097152 }, createdAt: new Date(), active: true },
        { name: 'Blog', subdomain: 'blog', stats: { storage: 5242880 }, createdAt: new Date(), active: false },
        { name: 'E-commerce', subdomain: 'shop', stats: { storage: 10485760 }, createdAt: new Date(), active: true },
        { name: 'Landing Page', subdomain: 'landing', stats: { storage: 1048576 }, createdAt: new Date(), active: true }
      ]
    };

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Get all sites (admin can view all sites)
router.get('/sites', async (req, res) => {
  try {
    // Mock sites data for demonstration
    const sites = [
      {
        _id: '1',
        name: 'My Portfolio',
        subdomain: 'portfolio',
        userId: { username: 'john_doe', email: 'john@example.com' },
        stats: { storage: 1048576, visits: 100 },
        createdAt: new Date(),
        active: true
      },
      {
        _id: '2',
        name: 'Business Site',
        subdomain: 'business',
        userId: { username: 'jane_smith', email: 'jane@example.com' },
        stats: { storage: 2097152, visits: 500 },
        createdAt: new Date(),
        active: true
      },
      {
        _id: '3',
        name: 'Blog Platform',
        subdomain: 'blog',
        userId: { username: 'mike_wilson', email: 'mike@example.com' },
        stats: { storage: 5242880, visits: 200 },
        createdAt: new Date(),
        active: false
      }
    ];

    res.json({
      sites,
      pagination: {
        current: 1,
        total: 1,
        count: sites.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sites' });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = {
      role: 'user',
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Get site count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const siteCount = await Site.countDocuments({ userId: user._id });
        const storageUsed = await Site.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, total: { $sum: '$stats.storage' } } }
        ]);
        
        return {
          ...user.toObject(),
          siteCount,
          storageUsed: storageUsed[0]?.total || 0
        };
      })
    );

    res.json({
      users: usersWithStats,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create new user
router.post('/users', [
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('plan').optional().isIn(['free', 'pro', 'enterprise'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, plan = 'free' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({ username, email, password, plan });
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:userId', [
  body('username').optional().isLength({ min: 3, max: 30 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('plan').optional().isIn(['free', 'pro', 'enterprise']),
  body('password').optional().isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const updates = req.body;

    // Don't allow changing role to admin through this endpoint
    if (updates.role) {
      delete updates.role;
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is trying to update to an existing username/email
    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({ username: updates.username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ email: updates.email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user fields
    Object.keys(updates).forEach(key => {
      user[key] = updates[key];
    });

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all sites belonging to the user
    const sites = await Site.find({ userId });
    
    for (const site of sites) {
      // Delete site files from filesystem
      const fs = require('fs-extra');
      const path = require('path');
      const sitePath = site.getSitePath();
      
      if (await fs.pathExists(sitePath)) {
        await fs.remove(sitePath);
      }
      
      await Site.findByIdAndDelete(site._id);
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User and all associated sites deleted successfully',
      deletedSitesCount: sites.length
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user details with full statistics
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's sites with detailed stats
    const sites = await Site.find({ userId })
      .select('name subdomain customDomains stats createdAt active')
      .sort({ createdAt: -1 });

    const totalStorage = sites.reduce((sum, site) => sum + site.stats.storage, 0);
    const totalVisits = sites.reduce((sum, site) => sum + site.stats.visits, 0);

    res.json({
      user,
      statistics: {
        totalSites: sites.length,
        totalStorage,
        totalVisits,
        activeSites: sites.filter(site => site.active).length
      },
      sites
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Get all sites (admin can view all sites)
router.get('/sites', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { subdomain: { $regex: search, $options: 'i' } }
      ]
    };

    const sites = await Site.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Site.countDocuments(query);

    res.json({
      sites,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Get all sites error:', error);
    res.status(500).json({ error: 'Failed to get sites' });
  }
});



module.exports = router;