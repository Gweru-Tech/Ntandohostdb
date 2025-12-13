# Deployment Guide for Ntando Hosting Platform

This guide will walk you through deploying the Ntando Hosting Platform on Render.com with custom domains support.

## Prerequisites

- A Render.com account (Free or Pro)
- A GitHub account
- Custom domains (optional, for production use)

## Step 1: Prepare Your Repository

1. **Fork the repository** to your GitHub account
2. **Clone your fork locally** to make any customizations
3. **Push any changes** to your fork

## Step 2: Set Up MongoDB Database

### Option A: Use Render's MongoDB

1. In your Render dashboard, click **New +**
2. Select **MongoDB**
3. Choose a name (e.g., `ntando-hosting-db`)
4. Select a plan (Free plan includes 1GB)
5. Click **Create Database**

### Option B: Use External MongoDB

Update the `MONGODB_URI` environment variable in your service configuration.

## Step 3: Deploy the Web Service

1. In your Render dashboard, click **New +**
2. Select **Web Service**
3. Connect your GitHub repository
4. Configure the service:

### Basic Settings
- **Name**: `ntando-hosting-platform`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `/`

### Build Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Advanced Settings
- **Auto-Deploy**: Yes (for automatic updates)
- **Health Check Path**: `/api/health`

## Step 4: Configure Environment Variables

Add these environment variables to your web service:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secure-jwt-secret-key
RENDER_HOSTNAME=your-service-name.onrender.com
RENDER_IP=auto-assigned-by-render
ALLOWED_ORIGINS=https://your-custom-domain.com
```

**Important**: Generate a secure JWT secret using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Configure Custom Domains

### Adding Supported Domains

1. In your web service settings, go to **Custom Domains**
2. Add the following domains:

```
ntando.app
ntando.cloud
ntando.zw
ntl.cloud
ntl.ai
ntl.zw
```

### DNS Configuration

For each domain, configure the following DNS records:

#### A Records
```
@    A    216.24.57.1     # Replace with your actual Render IP
www  A    216.24.57.1     # Replace with your actual Render IP
```

#### CNAME Records (Alternative)
```
www  CNAME  your-service-name.onrender.com
```

## Step 6: Test the Deployment

1. **Wait for deployment** to complete (usually 2-5 minutes)
2. **Visit your service URL**: `https://your-service-name.onrender.com`
3. **Test the health endpoint**: `https://your-service-name.onrender.com/api/health`
4. **Test user registration and login**
5. **Create a test site** and verify it's accessible

## Step 7: Configure SSL Certificates

Render automatically provides SSL certificates for:
- Your `.onrender.com` URL
- Custom domains (after DNS propagation)

## Step 8: Set Up Monitoring

### Health Checks
The platform includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logs
Monitor your service logs in the Render dashboard for:
- Application errors
- Performance issues
- Security events

## Step 9: Custom Domain Routing

The platform automatically handles subdomain routing. When users create sites with subdomains like `mysite.ntando.app`, the system:

1. Extracts the subdomain from the host header
2. Looks up the site in the database
3. Serves the appropriate files from the hosted-sites directory

## Step 10: Scaling Your Application

### Horizontal Scaling
1. Go to your web service settings
2. Click **Edit**
3. Increase the **Instance Count** (Pro plan required)
4. Save changes

### Database Scaling
If you need more storage:
1. Go to your MongoDB service
2. Click **Edit**
3. Upgrade to a higher plan
4. Update connection string if needed

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
- Check MongoDB connection string
- Verify database is running
- Check firewall settings

#### 2. Custom Domains Not Working
- Verify DNS records are correct
- Wait for DNS propagation (up to 48 hours)
- Check domain registration status

#### 3. File Upload Issues
- Check disk space
- Verify file size limits
- Check permissions on hosted-sites directory

#### 4. Authentication Problems
- Verify JWT_SECRET is set
- Check token expiration
- Clear browser cache and cookies

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

## Security Considerations

### Production Checklist
- [ ] Strong JWT secret key
- [ ] HTTPS only
- [ ] Rate limiting enabled
- [ ] Input validation enabled
- [ ] Regular backups
- [ ] Monitoring enabled
- [ ] Security headers configured

### Backup Strategy
1. **Database backups**: Enable automatic backups in MongoDB settings
2. **File backups**: Use Render's disk snapshots or cloud storage
3. **Code backups**: Maintain in Git with tags for releases

## Performance Optimization

### Database Optimization
- Monitor query performance
- Add indexes as needed
- Use connection pooling
- Regular maintenance

### File Storage Optimization
- Implement CDN for static assets
- Use compression for text files
- Cache frequently accessed files
- Monitor storage usage

## Maintenance

### Regular Tasks
- Update dependencies
- Monitor security advisories
- Check disk space usage
- Review access logs
- Test backup and recovery

### Updates
1. Test updates in a staging environment
2. Deploy during low-traffic periods
3. Monitor for issues
4. Roll back if necessary

## Support

For issues specific to this platform:
- Check the [GitHub Issues](https://github.com/your-username/ntando-hosting-platform/issues)
- Review the [documentation](README.md)

For Render-specific issues:
- Contact [Render Support](https://render.com/support)
- Check [Render Documentation](https://render.com/docs)

## Next Steps

After successful deployment:
1. Monitor performance and usage
2. Set up analytics and alerts
3. Plan for scaling based on usage
4. Consider adding additional features
5. Implement backup and disaster recovery plans