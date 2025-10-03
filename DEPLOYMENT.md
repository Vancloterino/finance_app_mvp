# Production Deployment Guide

This guide covers deploying the Finance App MVP to production.

## 📋 Prerequisites

- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)
- PostgreSQL 15+ database
- Redis 7+ instance
- SMTP email service
- Stripe account (live mode)

## 🔧 Environment Setup

### 1. Backend Configuration

Copy the production environment template:
```bash
cd backend
cp .env.production.example .env.production
```

Edit `.env.production` and set all required values:
- Generate a strong `SECRET_KEY` using: `openssl rand -hex 32`
- Set your production database URL
- Add your live Stripe keys
- Configure SMTP settings
- Set allowed hosts and CORS origins

### 2. Database Setup

Create production database:
```sql
CREATE DATABASE finance_app_production;
CREATE USER finance_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE finance_app_production TO finance_user;
```

Run migrations:
```bash
cd backend
poetry run alembic upgrade head
```

### 3. Frontend Configuration

Create production environment file:
```bash
cd frontend
cp .env.production.example .env.production
```

Set:
```
VITE_API_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Build production frontend:
```bash
npm run build
```

## 🚀 Deployment Options

### Option 1: Docker Deployment

#### Docker Compose Production

Create `docker-compose.production.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    env_file:
      - ./backend/.env.production
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    restart: always
    command: gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: finance_app_production
      POSTGRES_USER: finance_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Option 2: Cloud Platform Deployment

#### AWS Deployment (Recommended)

**Services Needed:**
- **EC2** or **ECS**: For running backend
- **RDS PostgreSQL**: Managed database
- **ElastiCache Redis**: Managed Redis
- **S3 + CloudFront**: For frontend static files
- **Route 53**: DNS management
- **Certificate Manager**: SSL certificates
- **Application Load Balancer**: Traffic distribution

**Backend on EC2:**
```bash
# Install dependencies
sudo apt update
sudo apt install python3.11 postgresql-client redis-tools

# Clone repository
git clone <your-repo-url>
cd finance_app_mvp/backend

# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install --no-dev

# Run with Gunicorn
poetry run gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

**Frontend on S3 + CloudFront:**
```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/

# Configure CloudFront distribution
# Point to S3 bucket
# Set custom domain
# Configure SSL certificate
```

#### DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure build settings:
   - **Backend**: Python, run `gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker`
   - **Frontend**: Node.js, build command `npm run build`, output directory `dist`
3. Add PostgreSQL and Redis as managed databases
4. Set environment variables
5. Configure custom domain and SSL

#### Heroku Deployment

**Backend:**
```bash
# Create Procfile
echo "web: gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker" > Procfile

# Create runtime.txt
echo "python-3.11" > runtime.txt

# Deploy
heroku create finance-app-backend
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
git push heroku main
```

**Frontend:**
```bash
# Deploy to Netlify or Vercel
npm run build

# Netlify
netlify deploy --prod --dir=dist

# Vercel
vercel --prod
```

## 🔒 Security Checklist

- [ ] SSL/TLS certificate installed and configured
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Strong SECRET_KEY generated
- [ ] Database credentials secured
- [ ] Stripe webhook signature verification enabled
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Environment variables not committed to Git
- [ ] Firewall rules configured (only necessary ports open)
- [ ] Database backups configured
- [ ] Regular security updates scheduled

## 📊 Monitoring & Logging

### Application Monitoring

**Sentry Integration:**
```bash
poetry add sentry-sdk
```

In `app/main.py`:
```python
import sentry_sdk
from app.core.config import settings

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1
    )
```

### Log Aggregation

Configure logging to send to:
- **CloudWatch** (AWS)
- **Papertrail**
- **Loggly**
- **ELK Stack**

### Health Checks

The app includes health check endpoints:
- `GET /health` - Basic health check
- `GET /` - API status

Configure monitoring to ping these endpoints every 1-5 minutes.

## 🔄 Backup Strategy

### Database Backups

**Automated Daily Backups:**
```bash
#!/bin/bash
# backup.sh
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
# Upload to S3 or backup storage
aws s3 cp backup_*.sql s3://your-backup-bucket/
```

**Backup Retention:**
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

### Disaster Recovery

1. Document recovery procedures
2. Test recovery process quarterly
3. Keep offsite backups
4. Maintain runbook for common issues

## 🚦 Deployment Process

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Environment variables verified
- [ ] Database migrations tested
- [ ] Backup created
- [ ] Rollback plan prepared

### Deployment Steps

1. **Backup Production Database**
   ```bash
   pg_dump $DATABASE_URL > pre_deploy_backup.sql
   ```

2. **Deploy Backend**
   ```bash
   git pull origin main
   poetry install --no-dev
   poetry run alembic upgrade head
   sudo systemctl restart finance-app
   ```

3. **Deploy Frontend**
   ```bash
   npm run build
   aws s3 sync dist/ s3://your-bucket/
   aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
   ```

4. **Verify Deployment**
   - Check health endpoints
   - Test critical user flows
   - Monitor error rates
   - Check application logs

### Rollback Procedure

If issues are detected:

1. **Rollback Backend**
   ```bash
   git checkout <previous-commit>
   poetry run alembic downgrade -1  # If migration issues
   sudo systemctl restart finance-app
   ```

2. **Restore Database** (if needed)
   ```bash
   psql $DATABASE_URL < pre_deploy_backup.sql
   ```

3. **Rollback Frontend**
   ```bash
   # Deploy previous build
   aws s3 sync previous-build/ s3://your-bucket/
   ```

## 📈 Scaling Considerations

### Horizontal Scaling

- Add more backend instances behind load balancer
- Use session-based load balancing
- Redis for shared cache/sessions

### Database Scaling

- Read replicas for read-heavy operations
- Connection pooling (already configured)
- Index optimization
- Query performance monitoring

### Caching Strategy

- Redis for session data
- CloudFront/CDN for static assets
- API response caching where appropriate

## 🛠️ Maintenance

### Regular Tasks

- **Daily**: Monitor error rates, check logs
- **Weekly**: Review performance metrics, check disk space
- **Monthly**: Security updates, dependency updates
- **Quarterly**: Disaster recovery test, security audit

### Updates

```bash
# Backend dependencies
poetry update

# Frontend dependencies
npm update

# Security patches
poetry update $(poetry show --outdated | cut -d' ' -f1)
```

## 📞 Support & Troubleshooting

### Common Issues

**Database Connection Errors:**
- Check DATABASE_URL
- Verify database is running
- Check firewall rules

**Stripe Webhook Failures:**
- Verify webhook secret
- Check endpoint URL
- Review Stripe dashboard logs

**High Memory Usage:**
- Reduce worker count
- Check for memory leaks
- Review database connection pooling

### Getting Help

- Check logs: `docker-compose logs -f backend`
- Review Sentry errors
- Check application health endpoints
- Review monitoring dashboards

## 🎉 Post-Deployment

- [ ] Verify all features working
- [ ] Run smoke tests
- [ ] Monitor for 24 hours
- [ ] Update documentation
- [ ] Notify team of successful deployment
