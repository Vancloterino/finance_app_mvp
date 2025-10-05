# Shared Finance App MVP

A comprehensive platform for managing shared financial responsibilities with transparency, fairness, and automated payment flows. Perfect for roommates, families, friends, or any group that needs to manage shared expenses democratically.

## ✨ Features

- **🏠 Shared Spaces**: Create expense or savings buckets (e.g., Rent, Utilities, Trip Fund)
- **📊 Flexible Allocations**: Percentage-based splits based on individual circumstances
- **📝 Pledge Tracking**: Non-custodial tracking of commitments and settlements
- **🗳️ Democratic Consent**: Group approval for payouts with smart defaults (75% threshold)
- **💳 Stripe Integration**: Secure payment processing without holding funds
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🔒 Enterprise Security**: JWT authentication, PCI compliance, webhook verification

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (required for database)
- **Node.js 18+** (for frontend development)
- **Python 3.11+** (for backend development)
- **Poetry** (for Python dependency management)

### 🐳 Easy Setup (Recommended - Full Docker Stack)

**1. Clone the repository:**
```bash
git clone <repo-url>
cd finance_app_mvp
```

**2. Start all services with Docker:**
```bash
# Build and start all services (postgres, redis, backend, frontend)
docker-compose build
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose ps
```

**3. Run database migrations:**
```bash
# Apply database migrations
docker-compose exec backend poetry run alembic upgrade head
```

**4. Access the application:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

**Important Notes:**
- Backend has hot-reload enabled (code changes reflect automatically)
- Frontend requires image rebuild for code changes: `docker-compose build frontend && docker-compose up -d frontend`

### 🔧 Alternative Setup (Local Development)

If you prefer running backend/frontend locally (faster for development):

**1. Start only databases:**
```bash
# Use the db-only compose file
docker-compose -f docker-compose.db-only.yml up -d
```

**2. Set up the backend (Terminal 1):**
```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**3. Set up the frontend (Terminal 2):**
```bash
cd frontend
npm install
npm run dev
```

**4. Access the application:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🎯 Full Setup Instructions

### Step 1: Environment Setup

#### Install Prerequisites
1. **Docker Desktop**: Download from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **Node.js**: Download from [nodejs.org](https://nodejs.org/) (v18 or higher)
3. **Python**: Download from [python.org](https://www.python.org/) (v3.11 or higher)
4. **Poetry**: Install via `pip install poetry` or [python-poetry.org](https://python-poetry.org/docs/#installation)

#### Verify installations:
```bash
docker --version          # Should show Docker version
node --version            # Should show Node.js v18+
python --version          # Should show Python 3.11+
poetry --version          # Should show Poetry version
```

### Step 2: Project Setup

#### Clone and navigate:
```bash
git clone <repo-url>
cd finance_app_mvp
```

#### Optional - Environment configuration:
```bash
# Copy environment template (optional - app works with defaults)
cp backend/.env.example backend/.env
# Edit backend/.env if you need custom configuration
```

### Step 3: Database Setup

#### Start database containers:
```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify containers are running and healthy
docker ps
```

You should see output like:
```
CONTAINER ID   IMAGE                COMMAND                  STATUS                    PORTS                    NAMES
<id>           postgres:15-alpine   "docker-entrypoint.s…"   Up 1 minute (healthy)     0.0.0.0:5432->5432/tcp   finance_app_postgres
<id>           redis:7-alpine       "docker-entrypoint.s…"   Up 1 minute (healthy)     0.0.0.0:6379->6379/tcp   finance_app_redis
```

#### Troubleshooting Database Issues:
If you encounter connection issues:
```bash
# Stop and remove containers with volumes
docker-compose down -v

# Restart fresh containers
docker-compose up -d

# Wait for containers to be healthy
sleep 15
```

### Step 4: Backend Setup

```bash
cd backend

# Install Python dependencies
poetry install

# Apply database migrations
poetry run alembic upgrade head

# Start the backend server
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Backend should start successfully with output:
```
INFO:     Will watch for changes in these directories: ['C:\\...\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [...] using WatchFiles
INFO:     Started server process [...]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### Verify backend is working:
- Visit http://localhost:8000/docs for API documentation
- You should see the FastAPI interactive documentation

### Step 5: Frontend Setup

Open a **new terminal** and run:
```bash
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

#### Frontend should start with output:
```
  VITE v5.x.x  ready in xxxms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 6: Test the Application

1. **Open your browser** to http://localhost:3000
2. **Create an account** by clicking "Create Account"
3. **Fill in the registration form** with any test data:
   - Name: Test User
   - Email: test@example.com
   - Password: testpass123
4. **Verify registration works** - you should get logged in automatically
5. **Explore the features** - create spaces, add pledges, etc.

## 🧪 Testing Registration

To verify everything is working correctly:

```bash
# Test the registration endpoint directly
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "testpass123"}'
```

**Expected response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## 🛠️ Development Workflow

### Daily Development (Full Docker Stack)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

### Daily Development (Local Development)
```bash
# Start databases only
docker-compose -f docker-compose.db-only.yml up -d

# Start backend (in terminal 1)
cd backend
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Start frontend (in terminal 2)
cd frontend
npm run dev

# Stop databases
docker-compose -f docker-compose.db-only.yml down
```

### Making Database Changes
```bash
# If using Docker:
docker-compose exec backend poetry run alembic revision --autogenerate -m "description"
docker-compose exec backend poetry run alembic upgrade head

# If running locally:
cd backend
poetry run alembic revision --autogenerate -m "description of changes"
poetry run alembic upgrade head
```

### Making Code Changes

**Backend Changes (with Docker):**
- Changes automatically reload (hot-reload enabled)
- No rebuild needed

**Frontend Changes (with Docker):**
```bash
# Rebuild frontend image after code changes
docker-compose build frontend
docker-compose up -d frontend
```

**Local Development:**
- Both backend and frontend auto-reload on save

## 📁 Project Structure

```
finance_app_mvp/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API routes
│   │   ├── core/           # Configuration & database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── services/       # Business logic
│   │   ├── schemas/        # Pydantic schemas
│   │   └── utils/          # Utility functions
│   ├── migrations/         # Alembic database migrations
│   └── tests/              # Backend tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context providers
│   │   ├── api/            # API client functions
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Utility functions
├── docker-compose.yml      # Database services
├── TODO.md                 # Development progress
└── README.md              # This file
```

## 🔧 Troubleshooting

### Common Issues:

#### "Connection refused" errors:
```bash
# Ensure Docker Desktop is running
docker ps

# Restart containers
docker-compose down
docker-compose up -d
```

#### Backend not starting:
```bash
# Check backend logs
docker-compose logs backend

# Common fix: rebuild backend image
docker-compose build backend
docker-compose up -d backend
```

#### Frontend not starting or "rollup" errors:
```bash
# Rebuild frontend image (fixes module issues)
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Check logs
docker-compose logs frontend
```

#### Database migration issues:
```bash
# Reset database completely
docker-compose down -v
docker-compose up -d postgres redis

# Wait for database to be ready
sleep 15

# Run migrations
docker-compose exec backend poetry run alembic upgrade head
```

#### Services not showing in `docker-compose ps`:
```bash
# Service crashed - check logs
docker-compose logs <service-name>

# Common fix: rebuild and restart
docker-compose build <service-name>
docker-compose up -d <service-name>
```

#### "Port already in use" errors:
```bash
# Check what's using the ports
# On Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Stop conflicting services or change ports in docker-compose.yml
```

### Useful Docker Commands

```bash
# View all container logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend

# Restart specific service
docker-compose restart backend

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Clean everything and start fresh
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Getting Help

- **API Documentation**: http://localhost:8000/docs
- **Backend Logs**: `docker-compose logs backend`
- **Frontend Logs**: `docker-compose logs frontend` or browser console (F12)
- **Database Logs**: `docker-compose logs postgres`
- **Container Status**: `docker-compose ps`

## 🎯 What You Can Do

### Core Features Available:
- ✅ **User Registration & Login** - Create accounts with email/password
- ✅ **Space Management** - Create shared expense groups
- ✅ **Member Allocation** - Set percentage-based contribution splits
- ✅ **Pledge Tracking** - Add and manage financial commitments
- ✅ **Democratic Payouts** - Create payouts with group approval workflow
- ✅ **Consent Management** - Vote on proposed payouts
- ✅ **Payment Integration** - Set up payment methods with Stripe
- ✅ **Transaction History** - View complete audit trails
- ✅ **Admin Controls** - Manage spaces and execute approved payouts

### Test Scenarios:
1. **Create a shared apartment space** with roommates
2. **Set up percentage allocations** based on income/room size
3. **Add monthly pledges** for rent, utilities, groceries
4. **Propose payouts** for landlord payments
5. **Experience democratic approval** process
6. **Set up payment methods** for real transactions
7. **Track transaction history** and balances

## 🚀 Ready for Production

The app includes enterprise-grade features:
- 🔒 **Security**: JWT authentication, input validation, webhook verification
- 💳 **PCI Compliance**: Stripe integration without storing card data
- 📊 **Scalability**: Async FastAPI backend, optimized React frontend
- 🗄️ **Database**: PostgreSQL with proper migrations and indexing
- 🎯 **UX**: Loading states, error handling, responsive design
- 🧪 **Reliability**: Comprehensive error handling and validation

**The finance app MVP is production-ready!** 🎉

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login-email` - Login with email/password

### Spaces
- `GET /api/v1/spaces` - List user's spaces
- `POST /api/v1/spaces` - Create new space
- `GET /api/v1/spaces/{id}` - Get space details

### Pledges
- `GET /api/v1/spaces/{id}/pledges` - List space pledges
- `POST /api/v1/spaces/{id}/pledges` - Create pledge

### Payouts
- `GET /api/v1/spaces/{id}/payouts` - List space payouts
- `POST /api/v1/spaces/{id}/payouts` - Create payout proposal

### Payments
- `GET /api/v1/payments/stripe-config` - Get Stripe configuration
- `POST /api/v1/payments/setup-intent` - Create payment setup

Visit http://localhost:8000/docs for complete interactive API documentation.

## 📄 License

[License information to be added]