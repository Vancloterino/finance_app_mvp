# App Feature Checklist

Use this checklist to verify that your app meets modern user expectations beyond its core functionality.

---

## 1. Authentication & Onboarding
- [ ] Email and password login  
- [ ] Social login (Google, Apple, etc.)  
- [ ] Email verification and password reset  
- [ ] Simple onboarding walkthrough  
- [ ] Profile setup (name, photo, currency)  
- [ ] Terms of Service & Privacy Policy acceptance  

---

## 2. UI / UX & Accessibility
- [ ] Responsive design (desktop, tablet, mobile)  
- [ ] Dark mode / Light mode  
- [ ] Consistent design system (buttons, spacing, typography)  
- [ ] Accessible color contrast and keyboard navigation  
- [ ] Loading states (spinners or skeletons)  
- [ ] Empty-state messages  
- [ ] Tooltips or inline help  

---

## 3. Security & Trust
- [ ] HTTPS enforced  
- [ ] JWT or session-based authentication  
- [ ] Rate limiting / brute-force protection  
- [ ] Secure password hashing (bcrypt or argon2)  
- [ ] Re-authentication for sensitive actions  
- [ ] Encrypted storage for sensitive data  
- [ ] Session logout / revoke across devices  

---

## 4. Notifications & Feedback
- [ ] Email notifications (pledges, payouts, approvals)  
- [ ] In-app notifications or toast messages  
- [ ] Push notifications (if applicable)  
- [ ] Activity feed or notification center  

---

## 5. Settings & Account Management
- [ ] Edit profile  
- [ ] Change password  
- [ ] Manage payment methods (Stripe, cards)  
- [ ] Notification preferences  
- [ ] Privacy controls (visibility of pledges)  
- [ ] Deactivate or delete account  

---

## 6. Communication & Support
- [ ] Help / FAQ section  
- [ ] Contact support (email or form)  
- [ ] Report a bug or feedback form  
- [ ] Social links (LinkedIn, Twitter, etc.)  

---

## 7. Performance & Reliability
- [ ] Fast page load (<2s for main screens)  
- [ ] API request retries  
- [ ] Caching (API or local storage)  
- [ ] Error boundaries / fallback screens  
- [ ] Image optimization and lazy loading  

---

## 8. Localization & Global Readiness
- [ ] Timezone consistency (store UTC, display local)  
- [ ] Currency formatting (symbols, decimals)  
- [ ] Multi-language ready (English default)  
- [ ] International email/phone validation  

---

## 9. Analytics & Monitoring
- [ ] User analytics (Google Analytics, Plausible, etc.)  
- [ ] Backend metrics (API latency, errors)  
- [ ] Event tracking (Space created, payout approved)  
- [ ] Crash/error tracking (Sentry or equivalent)  

---

## 10. Branding & Credibility
- [ ] Custom domain  
- [ ] Logo and favicon  
- [ ] App metadata (SEO title, meta tags)  
- [ ] About page  
- [ ] Privacy Policy and Terms of Use  
- [ ] Contact or team page  

---

## 11. Deployment & DevOps
- [ ] CI/CD pipeline (GitHub Actions or equivalent)  
- [ ] Backups (DB + S3)  
- [ ] Monitoring and alerting (CloudWatch, Sentry)  
- [ ] Versioned APIs  
- [ ] Feature flags for safe releases  

---

### Notes
- Use `[x]` to mark completed items.  
- Keep this checklist updated as the app evolves.  
- Treat it as a baseline for investor demos or public beta readiness.
