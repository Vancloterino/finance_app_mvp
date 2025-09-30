# Finance App MVP - Development Context

## 🎯 Project Summary

A shared finance application that enables groups (roommates, friends, family) to manage shared expenses transparently using a virtual ledger system with democratic consent workflows and real payment processing.

## 🏗️ Architecture Overview

### Backend (FastAPI + PostgreSQL)
- **Virtual Ledger System**: Non-custodial financial tracking with PLEDGE, DEBIT, CREDIT, ADJUST entries
- **Democratic Payouts**: 75% approval threshold by allocation percentage, 48-hour auto-approval timeout
- **Stripe Integration**: Real payment processing with PaymentIntents and webhook handling
- **Email Notifications**: SMTP-based alerts for invitations, consent requests, and payment updates

### Frontend (React + TypeScript + Tailwind)
- **React Context State Management**: Global state for user, spaces, and authentication
- **Protected Routing**: Authentication-aware navigation with React Router
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Architecture**: Reusable UI components with proper TypeScript interfaces

## 🔄 Current Development Status

### ✅ Completed (Backend - 100%)
- Complete API with all CRUD operations
- Payout management with consent workflow
- Stripe PaymentIntents integration
- Email notification system
- Database models and migrations
- Authentication with JWT

### ✅ Completed (Frontend - ~60%)
- Core infrastructure and API client
- State management and routing
- Authentication flow (login/homepage)
- Space management (list, create, detail)
- Responsive layout and navigation

### 🔄 In Progress
- Pledge management UI components

### 📅 Next Steps
1. Complete pledge management UI
2. Implement payout and consent workflows
3. Add Stripe payment method setup
4. Enhanced UX features (notifications, real-time updates)

## 🛠️ Technical Stack

**Backend:**
- FastAPI, PostgreSQL, Alembic, Stripe SDK
- Poetry for dependency management
- Pydantic for data validation
- SMTP email integration

**Frontend:**
- React 18, TypeScript, Vite
- Tailwind CSS, React Router, Axios
- Lucide React icons, Stripe Elements

## 🔧 Development Environment

- **Backend**: http://localhost:8000 (FastAPI with auto-reload)
- **Frontend**: http://localhost:3001 (Vite dev server with HMR)
- **Database**: PostgreSQL (local or Docker)

## 📋 Key Implementation Details

### Financial System
- **Proportional Splits**: Uses Largest Remainder Method for accurate cent distribution
- **Virtual Ledger**: No money held in escrow, tracks commitments and payments
- **Consent Workflow**: Quorum-based approval prevents unilateral decisions

### Security Features
- JWT authentication with protected routes
- Stripe webhook signature verification
- Input validation and error handling
- CORS configuration for frontend/backend communication

### User Experience
- Responsive design works on mobile and desktop
- Loading states and error handling throughout
- Real-time updates via API polling (planned)
- Toast notifications for user feedback (planned)

## 🎨 Design Patterns

### Backend
- Service layer pattern for business logic
- Repository pattern with SQLAlchemy ORM
- Dependency injection for database sessions
- Event-driven webhook handling

### Frontend
- Component composition with TypeScript interfaces
- Custom hooks for API operations
- Context API for global state management
- Protected routes with authentication checks

## 🧪 Current Functionality

**Working Features:**
- User registration and login
- Create and view shared spaces
- Member allocation management
- Responsive navigation
- Space statistics display

**API Endpoints Available:**
- `/api/v1/auth/*` - Authentication
- `/api/v1/spaces/*` - Space management
- `/api/v1/pledges/*` - Pledge operations
- `/api/v1/payouts/*` - Payout workflows
- `/api/v1/payments/*` - Stripe integration
- `/api/v1/notifications/*` - Email system

## 📝 Development Notes

- Backend follows FastAPI best practices with proper error handling
- Frontend uses TypeScript strictly for type safety
- Database migrations are version controlled with Alembic
- All API responses follow consistent error format
- Payment processing uses Stripe's recommended practices
- Email templates are HTML-based with proper styling

## 🔮 Next Session Goals

1. **Immediate**: Complete pledge management UI components
2. **Short-term**: Implement payout creation and consent submission flows
3. **Medium-term**: Add Stripe payment method setup and processing
4. **Long-term**: Deploy to production environment

The foundation is solid and the app is functional for space management. The architecture supports easy extension for remaining features.