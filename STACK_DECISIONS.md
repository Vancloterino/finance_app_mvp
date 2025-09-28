# Stack Decisions

## Frontend
- **Chosen:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui  
- **Why:** Fast iteration, type safety, Stripe Elements support, excellent DX.  
- **Alternatives:** Next.js (SSR/SEO, heavier infra), Vue (smaller ecosystem), Angular (enterprise-heavy).  

## Backend
- **Chosen:** Python + FastAPI + Pydantic  
- **Why:** Async-friendly, schema validation, quick iteration.  
- **Alternatives:** NestJS (TS-only stack), Django (batteries-included but heavier), Rails (rapid dev, smaller hiring pool).  

## Database
- **Chosen:** PostgreSQL (RDS)  
- **Why:** ACID, JSONB, strong for ledger invariants.  
- **Alternatives:** MySQL (simpler, weaker JSON), Aurora/CockroachDB (scale-out, more complexity).  

## Cache / Jobs
- **Chosen:** Redis (ElastiCache)  
- **Why:** Sessions, caching, lightweight async jobs.  
- **Alternatives:** SQS/Kafka (when scale requires it).  

## Payments
- **Chosen:** Stripe (PaymentIntents, SetupIntents, Webhooks)  
- **Why:** Global coverage, strong tooling, PCI compliance offload.  
- **Alternatives:** PayPal, Adyen, PayNow (later).  

## Auth
- **Chosen:** AWS Cognito (OIDC)  
- **Why:** Cost-effective, AWS-native, JWT flows.  
- **Alternatives:** Auth0, Clerk (better DX, higher cost).  

## Notifications
- **Chosen:** Postmark/SendGrid (email), Twilio (SMS)  
- **Why:** Reliable, templates, easy integration.  
- **Alternatives:** SES (cheaper but clunky), Firebase Cloud Messaging (push).  

## Deployment
- **Chosen:** AWS ECS Fargate + RDS + ElastiCache + S3
- **Why:** Serverless containers, low ops, AWS-native.
- **Alternatives:** EKS (more control, more ops), Render/Fly.io (faster launch, less control).

## Observability
- **Chosen:** OpenTelemetry, JSON logs, Sentry
- **Why:** Traceability, error tracking, alerting.
- **Alternatives:** Datadog, New Relic (paid, richer dashboards).

## Development Environment
- **Local Stack:** Docker Compose (Postgres, Redis, Stripe CLI)
- **Why:** Matches production, easy onboarding, isolated testing.
- **Tools:** Hot reload (Vite), API docs (FastAPI auto-gen), DB migrations (Alembic).

## Estimated Monthly Costs (MVP)
- **Compute:** ECS Fargate (1 vCPU, 2GB) ~$50/month
- **Database:** RDS t3.micro Postgres ~$25/month
- **Cache:** ElastiCache t3.micro Redis ~$20/month
- **Storage:** S3 standard ~$5/month
- **Networking:** ALB + data transfer ~$15/month
- **External:** Stripe (2.9% + 30¢), Postmark (~$10), Cognito (free tier)
- **Total:** ~$125/month + transaction fees

## Performance Targets
- **Load:** 100 active users, 500 transactions/month
- **Response Time:** <200ms API, <2s page load
- **Availability:** 99.5% uptime target

## Migration Paths
- **Redis → SQS:** When >100 active Spaces (queue depth, persistence needs)
- **ECS → EKS:** When team >5 engineers (complex deployments, multi-env)
- **Single region → Multi-region:** When >1000 users (latency, compliance)  
