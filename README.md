# Ntando Hosting Platform

A comprehensive web hosting platform built with Node.js that allows users to deploy HTML, CSS, and JavaScript websites with custom domains like `mysite.ntando.app`, `mysite.ntando.cloud`, `mysite.ntando.zw`, `mysite.ntl.cloud`, `mysite.ntl.ai`, and `mysite.ntl.zw`.

## Features

- 🚀 **Instant Deployment**: Upload and deploy websites in seconds
- 🌐 **Custom Domains**: Support for multiple custom domains
- 📁 **File Manager**: Easy-to-use interface for managing files
- 🔒 **SSL Security**: Free SSL certificates for all sites
- 📊 **Analytics**: Built-in analytics and visitor tracking
- 👥 **User Management**: Secure authentication and user accounts
- 🎨 **Modern UI**: Responsive, modern interface
- ⚡ **Fast Performance**: Optimized for speed and reliability

## Supported Domains

The platform supports the following custom domains:
- `*.ntando.app` - Premium app domain
- `*.ntando.cloud` - Cloud services domain  
- `*.ntando.zw` - Zimbabwe domain
- `*.ntl.cloud` - Short cloud domain
- `*.ntl.ai` - AI/tech domain
- `*.ntl.zw` - Short Zimbabwe domain

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: JWT tokens
- **File Storage**: Local filesystem (configurable)
- **Deployment**: Render.com

## Quick Start

### Prerequisites

- Node.js 18.0 or higher
- MongoDB 6.0 or higher
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ntando-hosting-platform.git
   cd ntando-hosting-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open http://localhost:3000 in your browser

### Production Deployment on Render.com

1. **Fork this repository** to your GitHub account

2. **Create a new Web Service** on Render.com
   - Connect your GitHub repository
   - Use the `render.yaml` configuration
   - Set environment variables as needed

3. **Create a MongoDB Database**
   - Use the provided MongoDB configuration
   - Update the `MONGODB_URI` environment variable

4. **Configure Custom Domains**
   - Add your custom domains in Render.com dashboard
   - Update DNS records as needed

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/api-key` - Generate API key

### Site Management Endpoints

- `GET /api/sites` - Get all sites for user
- `POST /api/sites` - Create new site
- `GET /api/sites/:id` - Get site details
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site
- `GET /api/sites/:id/files` - Get site files

### File Management Endpoints

- `POST /api/files/:siteId/upload` - Upload files
- `POST /api/files/:siteId/files` - Create/edit file
- `GET /api/files/:siteId/files/:filename` - Get file content
- `DELETE /api/files/:siteId/files/:filename` - Delete file
- `PUT /api/files/:siteId/files/:filename` - Rename file

### Domain Management Endpoints

- `GET /api/domains/supported` - Get supported domains
- `GET /api/domains/check/:domain/:subdomain` - Check subdomain availability
- `POST /api/domains/custom/:siteId` - Add custom domain
- `DELETE /api/domains/custom/:siteId/:domain` - Remove custom domain

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ntando-hosting` |
| `JWT_SECRET` | JWT secret key | `your-secret-key` |
| `RENDER_HOSTNAME` | Render service hostname | - |
| `RENDER_IP` | Render service IP | `127.0.0.1` |

### File Structure

```
ntando-hosting-platform/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── render.yaml              # Render.com configuration
├── .env.example             # Environment variables template
├── models/                  # Database models
│   ├── User.js             # User model
│   └── Site.js             # Site model
├── routes/                  # API routes
│   ├── auth.js             # Authentication routes
│   ├── sites.js            # Site management routes
│   ├── files.js            # File management routes
│   └── domains.js          # Domain management routes
├── middleware/              # Express middleware
│   └── auth.js             # Authentication middleware
├── public/                  # Frontend assets
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Styles
│   └── script.js           # Frontend JavaScript
├── hosted-sites/            # User-uploaded sites (auto-created)
├── docker/                  # Docker configuration
│   ├── Dockerfile.mongodb  # MongoDB Dockerfile
│   └── mongo-init.js       # Database initialization
└── README.md               # This file
```

## Security Features

- JWT-based authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers
- Password hashing with bcrypt
- File upload restrictions

## Performance Features

- MongoDB indexes for fast queries
- Static file caching
- Gzip compression
- CDN-ready architecture
- Optimized asset delivery

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please email support@ntando.app or create an issue in the GitHub repository.

## Roadmap

- [ ] Add more domain extensions
- [ ] Implement team collaboration features
- [ ] Add more analytics features
- [ ] Implement automatic backups
- [ ] Add site templates
- [ ] Implement CI/CD integration
- [ ] Add more payment providers
- [ ] Implement advanced caching
- [ ] Add multi-language support
- [ ] Implement API versioning

## FAQ

### Q: How do I add my own custom domain?
A: You can add custom domains through the dashboard or via the API. The platform will provide DNS records for you to configure.

### Q: Is there a file size limit?
A: Yes, the default file size limit is 50MB per file and 10 files per upload. These can be configured in the environment variables.

### Q: Can I use this for commercial projects?
A: Yes, this platform is MIT licensed and can be used for commercial projects.

### Q: How do I scale this for high traffic?
A: The platform is designed to scale horizontally on Render.com. You can add more instances as needed.

### Q: Can I integrate with other services?
A: Yes, the platform has a REST API that can be integrated with other services.