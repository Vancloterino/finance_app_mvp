# Shared Finance App

A platform for managing shared financial responsibilities with transparency, fairness, and automated payment flows.

## Overview

This app enables groups (roommates, families, friends) to manage shared expenses or savings goals where contributions are proportional, not equal. It provides a virtual ledger system with consent-driven payouts via Stripe integration.

## Key Features

- **Spaces**: Shared expense or savings buckets (e.g., Rent, Utilities, Trip Fund)
- **Percentage-based Allocations**: Flexible splits based on individual circumstances
- **Virtual Ledger**: Non-custodial tracking of pledges and settlements
- **Consent Workflow**: Group approval for payouts with smart defaults
- **Stripe Integration**: Secure payment processing without holding funds

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Python + FastAPI + PostgreSQL + Redis
- **Payment Processing**: Stripe PaymentIntents
- **Deployment**: Docker + AWS ECS Fargate

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)
- Poetry (for Python dependency management)

### Development Setup

1. **Clone and setup**:
   ```bash
   git clone <repo-url>
   cd finance_app_mvp
   ```

2. **Environment configuration**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start services**:
   ```bash
   cd docker
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Development (without Docker)

**Backend:**
```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
finance_app_mvp/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── migrations/         # Alembic database migrations
│   └── tests/              # Backend tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API clients
│   │   └── types/          # TypeScript types
├── docker/                 # Docker configuration
└── docs/                   # Documentation
```

## API Documentation

When running locally, visit http://localhost:8000/docs for interactive API documentation.

## Contributing

1. Create feature branches from `main`
2. Follow conventional commit messages
3. Ensure tests pass before submitting PRs
4. Update documentation as needed

## License

[License information to be added]