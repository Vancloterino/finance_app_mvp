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
