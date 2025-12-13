const express = require('express');
const { body, validationResult } = require('express-validator');
const Site = require('../models/Site');
const auth = require('../middleware/auth');

const router = express.Router();

// Get supported domains
router.get('/supported', auth, async (req, res) => {
  try {
    const supportedDomains = [
      { domain: 'ntando.app', description: 'Premium app domain', available: true },
      { domain: 'ntando.cloud', description: 'Cloud services domain', available: true },
      { domain: 'ntando.zw', description: 'Zimbabwe domain', available: true },
      { domain: 'ntl.cloud', description: 'Short cloud domain', available: true },
      { domain: 'ntl.ai', description: 'AI/tech domain', available: true },
      { domain: 'ntl.zw', description: 'Short Zimbabwe domain', available: true }
    ];

    res.json({ domains: supportedDomains });
  } catch (error) {
    console.error('Get supported domains error:', error);
    res.status(500).json({ error: 'Failed to get supported domains' });
  }
});

// Check subdomain availability
router.get('/check/:domain/:subdomain', auth, async (req, res) => {
  try {
    const { domain, subdomain } = req.params;
    
    // Validate domain is supported
    const supportedDomains = ['ntando.app', 'ntando.cloud', 'ntando.zw', 'ntl.cloud', 'ntl.ai', 'ntl.zw'];
    if (!supportedDomains.includes(domain.toLowerCase())) {
      return res.status(400).json({ error: 'Domain not supported' });
    }

    // Check if subdomain is already taken
    const existingSite = await Site.findOne({ 
      subdomain: subdomain.toLowerCase(),
      active: true 
    });

    const isAvailable = !existingSite;
    
    res.json({ 
      available: isAvailable,
      subdomain: subdomain.toLowerCase(),
      domain: domain.toLowerCase(),
      fullDomain: `${subdomain.toLowerCase()}.${domain.toLowerCase()}`
    });
  } catch (error) {
    console.error('Check subdomain error:', error);
    res.status(500).json({ error: 'Failed to check subdomain' });
  }
});

// Add custom domain to site
router.post('/custom/:siteId', auth, [
  body('domain').isLength({ min: 3, max: 253 }).isFQDN()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const site = await Site.findOne({ _id: req.params.siteId, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const { domain } = req.body;
    const normalizedDomain = domain.toLowerCase();

    // Check if domain is already added to this site
    const existingDomain = site.customDomains.find(d => d.domain === normalizedDomain);
    if (existingDomain) {
      return res.status(400).json({ error: 'Domain already added to this site' });
    }

    // Check if domain is used by another site
    const otherSite = await Site.findOne({
      _id: { $ne: req.params.siteId },
      'customDomains.domain': normalizedDomain
    });

    if (otherSite) {
      return res.status(400).json({ error: 'Domain already in use by another site' });
    }

    // Add custom domain
    const customDomain = {
      domain: normalizedDomain,
      verified: false,
      sslEnabled: false,
      dnsRecords: {
        A: [process.env.RENDER_IP || '127.0.0.1'],
        CNAME: [],
        TXT: []
      }
    };

    site.customDomains.push(customDomain);
    await site.save();

    res.json({
      message: 'Custom domain added successfully',
      domain: customDomain,
      dnsInstructions: {
        'A Record': `Point ${normalizedDomain} to ${process.env.RENDER_IP || 'YOUR_SERVER_IP'}`,
        'CNAME': `Alternatively, set CNAME to ${process.env.RENDER_HOSTNAME || 'your-service.onrender.com'}`
      }
    });
  } catch (error) {
    console.error('Add custom domain error:', error);
    res.status(500).json({ error: 'Failed to add custom domain' });
  }
});

// Remove custom domain from site
router.delete('/custom/:siteId/:domain', auth, async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const domain = req.params.domain.toLowerCase();
    const domainIndex = site.customDomains.findIndex(d => d.domain === domain);

    if (domainIndex === -1) {
      return res.status(404).json({ error: 'Domain not found for this site' });
    }

    site.customDomains.splice(domainIndex, 1);
    await site.save();

    res.json({ message: 'Custom domain removed successfully' });
  } catch (error) {
    console.error('Remove custom domain error:', error);
    res.status(500).json({ error: 'Failed to remove custom domain' });
  }
});

// Verify custom domain
router.post('/verify/:siteId/:domain', auth, async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, userId: req.userId });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const domain = req.params.domain.toLowerCase();
    const customDomain = site.customDomains.find(d => d.domain === domain);

    if (!customDomain) {
      return res.status(404).json({ error: 'Domain not found for this site' });
    }

    // In a real implementation, you would verify DNS records here
    // For now, we'll simulate verification
    customDomain.verified = true;
    customDomain.sslEnabled = true;
    
    await site.save();

    res.json({
      message: 'Domain verified successfully',
      domain: customDomain
    });
  } catch (error) {
    console.error('Verify domain error:', error);
    res.status(500).json({ error: 'Failed to verify domain' });
  }
});

// Get DNS configuration
router.get('/dns/:domain/:subdomain', auth, async (req, res) => {
  try {
    const { domain, subdomain } = req.params;
    
    // Validate domain is supported
    const supportedDomains = ['ntando.app', 'ntando.cloud', 'ntando.zw', 'ntl.cloud', 'ntl.ai', 'ntl.zw'];
    if (!supportedDomains.includes(domain.toLowerCase())) {
      return res.status(400).json({ error: 'Domain not supported' });
    }

    const fullDomain = `${subdomain.toLowerCase()}.${domain.toLowerCase()}`;
    
    const dnsConfig = {
      domain: fullDomain,
      records: {
        A: {
          host: '@',
          value: process.env.RENDER_IP || 'YOUR_SERVER_IP',
          ttl: 300
        },
        CNAME: {
          host: 'www',
          value: process.env.RENDER_HOSTNAME || 'your-service.onrender.com',
          ttl: 300
        },
        MX: {
          host: '@',
          value: `mail.${fullDomain}`,
          priority: 10,
          ttl: 300
        }
      },
      nameservers: [
        `ns1.${domain}`,
        `ns2.${domain}`
      ]
    };

    res.json({ dnsConfig });
  } catch (error) {
    console.error('Get DNS config error:', error);
    res.status(500).json({ error: 'Failed to get DNS configuration' });
  }
});

module.exports = router;