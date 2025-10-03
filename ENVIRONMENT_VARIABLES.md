# Environment Variables Guide

Complete reference for all environment variables used in the Finance App MVP.

## 🔧 Backend Environment Variables

### Required Variables

#### Application Settings
- **`ENVIRONMENT`** (required)
  - Values: `development`, `staging`, `production`
  - Default: `development`
  - Description: Runtime environment

- **`SECRET_KEY`** (required)
  - Generate with: `openssl rand -hex 32`
  - Description: JWT token signing key
  - **⚠️ Must be different for each environment**

- **`API_V1_STR`** (optional)
  - Default: `/api/v1`
  - Description: API version prefix

- **`ACCESS_TOKEN_EXPIRE_MINUTES`** (optional)
  - Default: `10080` (7 days)
  - Description: JWT token expiration time

#### Database Configuration
- **`DATABASE_URL`** (required)
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://finance_user:password@localhost:5432/finance_app`
  - Description: PostgreSQL connection string

- **`DATABASE_POOL_SIZE`** (optional)
  - Default: `5`
  - Production: `20`
  - Description: Database connection pool size

- **`DATABASE_MAX_OVERFLOW`** (optional)
  - Default: `10`
  - Description: Maximum overflow connections

#### Redis Configuration
- **`REDIS_URL`** (required)
  - Format: `redis://host:port/db`
  - Example: `redis://localhost:6379/0`
  - Description: Redis connection string for caching

#### Stripe Configuration
- **`STRIPE_SECRET_KEY`** (required)
  - Test: `sk_test_...`
  - Live: `sk_live_...`
  - Description: Stripe API secret key

- **`STRIPE_PUBLISHABLE_KEY`** (required)
  - Test: `pk_test_...`
  - Live: `pk_live_...`
  - Description: Stripe publishable key (also used by frontend)

- **`STRIPE_WEBHOOK_SECRET`** (required)
  - Format: `whsec_...`
  - Description: Webhook signing secret for verification
  - **⚠️ Different for test and live mode**

#### Email Configuration
- **`SMTP_HOST`** (required)
  - Example: `smtp.gmail.com`
  - Description: SMTP server hostname

- **`SMTP_PORT`** (required)
  - Common: `587` (TLS), `465` (SSL)
  - Description: SMTP server port

- **`SMTP_USER`** (required)
  - Description: SMTP authentication username

- **`SMTP_PASSWORD`** (required)
  - Description: SMTP authentication password

- **`SMTP_FROM`** (required)
  - Example: `noreply@yourdomain.com`
  - Description: Sender email address

- **`SMTP_FROM_NAME`** (optional)
  - Default: `Finance App`
  - Description: Sender display name

#### Security Settings
- **`ALLOWED_HOSTS`** (required in production)
  - Format: Comma-separated list
  - Example: `yourdomain.com,www.yourdomain.com`
  - Description: Allowed host headers

- **`CORS_ORIGINS`** (required)
  - Format: Comma-separated list
  - Example: `https://yourdomain.com,https://www.yourdomain.com`
  - Development: `http://localhost:3000`
  - Description: Allowed CORS origins

#### Optional Settings
- **`DEBUG`** (optional)
  - Values: `true`, `false`
  - Default: `false` in production
  - Description: Enable debug mode (⚠️ Never use in production)

- **`LOG_LEVEL`** (optional)
  - Values: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
  - Default: `INFO`
  - Description: Logging level

- **`SENTRY_DSN`** (optional)
  - Description: Sentry error tracking DSN

- **`FRONTEND_URL`** (optional)
  - Default: `http://localhost:3000`
  - Production: `https://yourdomain.com`
  - Description: Frontend URL for email links

## 🎨 Frontend Environment Variables

### Required Variables

- **`VITE_API_URL`** (required)
  - Development: `http://localhost:8000`
  - Production: `https://api.yourdomain.com`
  - Description: Backend API base URL

- **`VITE_STRIPE_PUBLISHABLE_KEY`** (required)
  - Test: `pk_test_...`
  - Live: `pk_live_...`
  - Description: Stripe publishable key for client-side

### Optional Variables

- **`VITE_APP_NAME`** (optional)
  - Default: `Finance App`
  - Description: Application display name

## 📝 Environment Files

### Development
Create `.env` files:
```bash
# Backend
backend/.env

# Frontend
frontend/.env
```

### Production
Create `.env.production` files:
```bash
# Backend
backend/.env.production

# Frontend
frontend/.env.production
```

## 🔒 Security Best Practices

### 1. Never Commit Secrets
```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Different Secrets Per Environment
- **Development**: Use test keys
- **Staging**: Use separate test keys
- **Production**: Use live keys with strong secrets

### 3. Rotate Secrets Regularly
- Rotate `SECRET_KEY` quarterly
- Update Stripe keys if compromised
- Change database passwords annually

### 4. Secure Storage
- Use secret management services:
  - AWS Secrets Manager
  - HashiCorp Vault
  - Azure Key Vault
  - Google Secret Manager

## 🚀 Quick Setup

### Development Setup
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and fill in development values

# Frontend
cd frontend
cp .env.example .env
# Edit .env and fill in development values
```

### Production Setup
```bash
# Backend
cd backend
cp .env.production.example .env.production
# Edit .env.production with production values
# Generate new SECRET_KEY: openssl rand -hex 32

# Frontend
cd frontend
cp .env.production.example .env.production
# Edit .env.production with production values
```

## 🧪 Testing Configuration

Tests use in-memory SQLite and mock services:
```python
# tests/conftest.py handles test configuration
# No separate .env.test file needed
```

## ✅ Validation Checklist

Before deploying:
- [ ] All required variables set
- [ ] Production secrets are strong and unique
- [ ] CORS origins restricted to production domains
- [ ] Stripe keys match environment (test vs live)
- [ ] Email credentials valid and tested
- [ ] Database URL points to correct database
- [ ] Redis URL accessible
- [ ] Secret files not in version control
- [ ] Environment variables documented for team

## 🔍 Troubleshooting

### Common Issues

**"Database connection failed"**
- Check `DATABASE_URL` format
- Verify database server is running
- Test connection: `psql $DATABASE_URL`

**"CORS error in browser"**
- Verify `CORS_ORIGINS` includes frontend URL
- Check protocol (http vs https)
- Ensure no trailing slashes

**"Stripe webhook signature verification failed"**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check environment (test vs live mode)

**"Email sending failed"**
- Verify SMTP credentials
- Check SMTP port and security (TLS/SSL)
- Test with: `telnet smtp_host smtp_port`

## 📖 Additional Resources

- [FastAPI Settings Documentation](https://fastapi.tiangolo.com/advanced/settings/)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [12-Factor App: Config](https://12factor.net/config)
