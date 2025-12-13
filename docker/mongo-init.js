db = db.getSiblingDB('ntando-hosting');

// Create application user
db.createUser({
  user: 'ntando-app',
  pwd: 'app-password-123',
  roles: [
    {
      role: 'readWrite',
      db: 'ntando-hosting'
    }
  ]
});

// Create collections and indexes
db.createCollection('users');
db.createCollection('sites');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.sites.createIndex({ "subdomain": 1 }, { unique: true });
db.sites.createIndex({ "userId": 1 });
db.sites.createIndex({ "customDomains.domain": 1 });

print('Database initialization completed successfully!');