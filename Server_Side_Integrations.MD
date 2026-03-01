# Server-Side Integrations — Removed & Documented

This document records all server-side integrations that were removed from Nodebase to transform it into a client-only UI/UX application. Each section notes the original purpose and what to connect when building the custom backend.

---

## 1. Database — Prisma + PostgreSQL (Neon)

### What was removed
- Package: `prisma`, `@prisma/client`
- Files: `prisma/` schema directory, `src/generated/` (Prisma client), `src/lib/db.ts`
- All `@/generated/prisma` imports replaced with local enums in `src/config/node-components.ts`

### Custom backend integration points
- Expose a REST/GraphQL API for all CRUD operations
- `NodeType` and `ExecutionStatus` enums must match the database schema values
- Re-add `src/generated/` (or use a custom type package) when Prisma is re-introduced

---

## 2. Authentication — Better Auth

### What was removed
- Package: `better-auth`
- Files: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/`
- All `authClient.*` calls replaced with `toast.info("…requires custom backend")` stubs
- `requireAuth()` calls commented out in all dashboard pages

### Custom backend integration points
All auth flows need corresponding endpoints:

| Action | Stub location | Backend route |
|---|---|---|
| Email register | `register-form.tsx` | `POST /api/auth/register` |
| Email login | `login-form.tsx` | `POST /api/auth/login` |
| GitHub OAuth | `login-form.tsx`, `register-form.tsx` | `GET /api/auth/github` |
| Google OAuth | `login-form.tsx`, `register-form.tsx` | `GET /api/auth/google` |
| Sign out | `app-sidebar.tsx` | `POST /api/auth/logout` |
| Billing/checkout | `app-sidebar.tsx`, `upgrade-modal.tsx` | `POST /api/billing/checkout` |
| Billing portal | `app-sidebar.tsx` | `GET /api/billing/portal` |

**Re-enable auth guards** by uncommenting `// await requireAuth()` in all dashboard page files once the backend exposes a session-check endpoint.

---

## 3. Background Jobs — Inngest

### What was removed
- Packages: `inngest`, `@inngest/realtime`
- Files: `src/inngest/` (client, functions, channels), `src/app/api/inngest/`
- All `actions.ts` files (per node type) — replaced with no-op stubs
- All `executor.ts` files — replaced with passthrough stubs
- `src/features/executions/hooks/use-node-status.ts` — removed (realtime status hook)
- Scripts removed from `package.json`: `inngest:dev`, `ngrok:dev`, `dev:all`

### Custom backend integration points
Each node executor needs a corresponding backend handler:

| Node | Executor stub file |
|---|---|
| Manual Trigger | `src/features/triggers/components/manual-trigger/executor.ts` |
| Google Form Trigger | `src/features/triggers/components/google-form-trigger/executor.ts` |
| Stripe Trigger | `src/features/triggers/components/stripe-trigger/executor.ts` |
| HTTP Request | `src/features/executions/components/http-request/executor.ts` |
| Gemini | `src/features/executions/components/gemini/executor.ts` |
| OpenAI | `src/features/executions/components/openai/executor.ts` |
| Anthropic | `src/features/executions/components/anthropic/executor.ts` |
| Discord | `src/features/executions/components/discord/executor.ts` |
| Slack | `src/features/executions/components/slack/executor.ts` |

Each `actions.ts` file (per node) is the place to add real-time token fetching once a backend SSE/WebSocket is available.

---

## 4. tRPC — API Layer

### What was removed
- Packages: `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@trpc/next`, `superjson`
- Files: `src/trpc/` (entire directory — routers, server, client)
- Files: `src/features/*/server/routers.ts`
- `TRPCReactProvider` removed from `src/app/layout.tsx`
- All `useTRPC`, `useSuspenseQuery`, `useMutation`, `HydrateClient`, server prefetch calls removed

### Custom backend integration points
All tRPC procedure calls replaced with stub hooks in:

| Hook file | Stubs provided |
|---|---|
| `src/features/workflows/hooks/use-workflows.ts` | `useSuspenseWorkflows`, `useCreateWorkflow`, `useRemoveWorkflow`, `useSuspenseWorkflow`, `useUpdateWorkflowName`, `useUpdateWorkflow`, `useExecuteWorkflow` |
| `src/features/credentials/hooks/use-credentials.ts` | `useSuspenseCredentials`, `useCreateCredential`, `useRemoveCredential`, `useSuspenseCredential`, `useUpdateCredential`, `useCredentialsByType` |
| `src/features/executions/hooks/use-executions.ts` | `useSuspenseExecutions`, `useSuspenseExecution` |

To integrate with a custom backend, replace `toast.info(…)` stubs inside these hooks with `fetch`/`ky` calls to the corresponding REST endpoints.

---

## 5. Billing — Polar

### What was removed
- Packages: `@polar-sh/nextjs`, `@polar-sh/sdk`
- Files: `src/lib/polar.ts`, `src/app/api/polar/`
- `authClient.checkout({ slug: "pro" })` → toast stub in `upgrade-modal.tsx` and `app-sidebar.tsx`
- `authClient.customer.portal()` → toast stub in `app-sidebar.tsx`

### Custom backend integration points
| Feature | Stub location |
|---|---|
| Subscription status | `src/features/subscriptions/hooks/use-subscription.ts` — returns `hasActiveSubscription: false` |
| Checkout | `upgrade-modal.tsx`, `app-sidebar.tsx` → connect to `POST /api/billing/checkout` |
| Portal | `app-sidebar.tsx` → connect to `GET /api/billing/portal` |

---

## 6. Monitoring — Sentry

### What was removed
- Package: `@sentry/nextjs`
- Files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/app/sentry-example-page/`, `src/instrumentation.ts`
- `withSentryConfig` wrapper removed from `next.config.ts`
- `src/app/global-error.tsx` simplified to plain React error boundary

### Custom backend integration points
Re-add Sentry or a similar monitoring solution (LogRocket, Datadog) when the backend is ready. Configure in `next.config.ts` and `src/instrumentation.ts`.

---

## 7. Encryption — Cryptr

### What was removed
- Package: `cryptr`
- File: `src/lib/encryption.ts`

### Custom backend integration point
Credential values must be encrypted at rest on the backend. Use AES-256-GCM or equivalent. Pass only encrypted values over the wire; decrypt only on the backend.

---

## 8. AI SDK — Vercel AI

### What was removed
- Packages: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai`

### Custom backend integration points
- The executor stubs in each AI node (`gemini/`, `openai/`, `anthropic/`) are the integration points
- AI calls should be made from the backend (keeps API keys server-side)
- The backend returns results to the client via the execution status websocket/SSE

---

## 9. Email Rendering — Handlebars + html-entities + toposort

### What was removed
- Packages: `handlebars`, `html-entities`, `toposort`

### Custom backend integration points
- These were used in the workflow runner to template node data
- The custom backend workflow engine should implement the same `{{variable}}` templating
- `toposort` was used to determine node execution order — re-implement in the backend DAG runner

---

## 10. Environment Variables Removed

All previously configured env vars have been cleared from `.env`. When reconnecting:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma PostgreSQL connection |
| `BETTER_AUTH_SECRET` | Auth token signing secret |
| `BETTER_AUTH_URL` | Auth redirect base URL |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `POLAR_ACCESS_TOKEN` | Polar billing API |
| `POLAR_SUCCESS_URL` | Checkout redirect |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Inngest webhook verification |
| `NGROK_URL` | Tunnel URL for local webhook testing |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | AI provider keys |

---

_Last updated: 2026-03-01_
