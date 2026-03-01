# Nodebase

A visual workflow automation platform — similar to n8n — built with **Next.js 15** on the frontend and a custom **Node.js + Express** API server on the backend. Design, save, and execute multi-step workflows that chain together AI models, HTTP requests, messaging platforms, and external trigger sources like Google Forms and Stripe, all with real-time execution status visualised directly in the editor.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Repository Structure](#repository-structure)
4. [Backend — Setup & Configuration](#backend--setup--configuration)
   - [Environment Variables](#backend-environment-variables)
   - [Dependencies](#backend-dependencies)
   - [Database Migrations](#database-migrations)
   - [Running the Backend](#running-the-backend)
5. [Frontend — Setup & Configuration](#frontend--setup--configuration)
   - [Environment Variables](#frontend-environment-variables)
   - [Dependencies](#frontend-dependencies)
   - [Running the Frontend](#running-the-frontend)
6. [Inngest Dev Server](#inngest-dev-server)
7. [Webhooks (Local Development)](#webhooks-local-development)
8. [API Reference](#api-reference)
9. [Workflow Engine](#workflow-engine)
10. [Node Types & Executors](#node-types--executors)
11. [Real-Time Execution Status (SSE)](#real-time-execution-status-sse)
12. [Authentication](#authentication)
13. [Credential Encryption](#credential-encryption)
14. [Key Architectural Decisions](#key-architectural-decisions)
15. [What Was Removed](#what-was-removed)

---

## Architecture Overview

```
┌──────────────────────────────────────────────┐
│              Next.js Frontend (port 3000)     │
│                                               │
│  React 19 · Jotai · ky · @xyflow/react        │
│  shadcn/ui · react-hook-form · zod            │
│                                               │
│  API Layer: src/api/{client,auth,workflows,   │
│             credentials}.ts                   │
│                                               │
│  SSE streams ──────────────────────────────► │
└──────────────────┬───────────────────────────┘
                   │ HTTP + SSE (cookie auth)
                   ▼
┌──────────────────────────────────────────────┐
│           Express Backend (port 4000)         │
│                                               │
│  7 REST modules: auth, users, workflows,      │
│  nodes, connections, credentials, executions │
│  + webhooks (no auth)                         │
│                                               │
│  Middleware: JWT cookies, Helmet, CORS,       │
│  rate-limit, Zod validation, request logger   │
└──────────────┬───────────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐   ┌─────────────────────────────┐
│  PostgreSQL │   │        Inngest               │
│  (NeonDB)   │   │                              │
│             │   │  Durable background jobs     │
│  12 SQL     │   │  execute-workflow function   │
│  migrations │   │  9 node executors            │
│  RLS + AES  │   │  SSE events pushed back      │
│  encryption │   │  to Express → browser        │
└─────────────┘   └─────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Layer              | Technology                                    |
| ------------------ | --------------------------------------------- |
| Framework          | Next.js 15.5.4 (App Router, Turbopack)        |
| UI Library         | React 19                                      |
| State Management   | Jotai 2                                       |
| HTTP Client        | ky 1                                          |
| Flow Editor        | @xyflow/react 12                              |
| Forms              | react-hook-form 7 + zod 4                     |
| UI Components      | shadcn/ui (Radix primitives + Tailwind CSS 4) |
| Icons              | lucide-react                                  |
| Notifications      | sonner                                        |
| Linting/Formatting | Biome 2                                       |

### Backend

| Layer            | Technology                                                                    |
| ---------------- | ----------------------------------------------------------------------------- |
| Runtime          | Node.js (ESM, `"type": "module"`)                                             |
| Framework        | Express 5                                                                     |
| Database         | PostgreSQL via `pg` Pool (NeonDB, always-on SSL)                              |
| Auth             | JWT (jsonwebtoken) stored in httpOnly cookies                                 |
| Password Hashing | bcryptjs                                                                      |
| Encryption       | AES-256-GCM via Node.js `node:crypto`                                         |
| Workflow Engine  | Inngest (durable steps, local dev server)                                     |
| AI SDK           | Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/anthropic`) |
| Templating       | Handlebars (with custom `json`, `encodeURI`, `eq` helpers)                    |
| Graph Ordering   | toposort                                                                      |
| ID Generation    | uuid v4                                                                       |
| Validation       | zod 4                                                                         |
| Security         | helmet, cors, express-rate-limit                                              |
| Logging          | Custom structured JSON logger                                                 |

---

## Repository Structure

```
nodebase/
├── package.json                    # Frontend dependencies
├── next.config.ts
├── tsconfig.json
├── biome.json
├── README.MD
├── Server_Side_Integrations.MD
│
├── nodebase_backend/               # Express API server (separate project)
│   ├── package.json
│   ├── .env                        # Backend env vars (not committed)
│   └── src/
│       ├── server.js               # Entry point — starts on PORT (default 4000)
│       ├── app.js                  # Express app, middleware, routes
│       ├── config/
│       │   ├── env.js              # Validates + exports all env vars
│       │   ├── db.js               # pg Pool (SSL always-on for NeonDB)
│       │   └── constants.js        # NodeType + ExecutionStatus enums
│       ├── middleware/
│       │   ├── auth.js             # verifyToken — JWT cookie middleware
│       │   ├── validate.js         # Zod schema request validation
│       │   ├── error-handler.js    # Global error handler
│       │   ├── not-found.js        # 404 handler
│       │   └── request-logger.js   # HTTP request/response logger
│       ├── modules/
│       │   ├── auth/               # register, login, logout, me
│       │   ├── users/              # user profile CRUD
│       │   ├── workflows/          # workflow CRUD + execute + SSE stream
│       │   ├── nodes/              # node CRUD per workflow
│       │   ├── connections/        # connection (edge) CRUD per workflow
│       │   ├── credentials/        # encrypted credential CRUD
│       │   ├── executions/         # execution history + SSE stream
│       │   │   └── sse.js          # SSEManager (execution + workflow level)
│       │   └── webhooks/           # Google Form + Stripe inbound webhooks
│       ├── engine/
│       │   ├── runner.js           # Workflow orchestrator
│       │   ├── toposort.js         # DAG topological sort
│       │   └── template.js         # Handlebars template resolution
│       ├── inngest/
│       │   ├── client.js           # Inngest client (isDev in development)
│       │   ├── serve.js            # inngest/express serve middleware
│       │   ├── functions/
│       │   │   └── execute-workflow.js
│       │   └── executors/          # 9 node executors (one per node type)
│       ├── scripts/
│       │   ├── migrate.js          # Migration runner
│       │   ├── 000_create_extensions.sql
│       │   ├── 001_create_enums.sql
│       │   ├── 002_create_users.sql
│       │   ├── 003_create_sessions.sql
│       │   ├── 004_create_accounts.sql
│       │   ├── 005_create_verifications.sql
│       │   ├── 006_create_credentials.sql
│       │   ├── 007_create_workflows.sql
│       │   ├── 008_create_nodes.sql
│       │   ├── 009_create_connections.sql
│       │   ├── 010_create_executions.sql
│       │   └── 011_create_node_executions.sql
│       └── utils/
│           ├── api-response.js     # Standardised JSON response helper
│           ├── api-error.js        # AppError class with status code
│           ├── catch-async.js      # Wraps async controllers
│           ├── encryption.js       # AES-256-GCM encrypt/decrypt
│           ├── logger.js           # Structured JSON logger (stdout)
│           └── transaction.js      # withTransaction() + RLS SET LOCAL
│
└── src/
    ├── api/                        # Frontend HTTP client layer
    │   ├── client.ts               # ky instance (NEXT_PUBLIC_API_URL, cookies)
    │   ├── auth.ts                 # login, register, logout, getMe
    │   ├── workflows.ts            # workflow CRUD + execute + save
    │   └── credentials.ts          # credential CRUD + getByType
    ├── app/
    │   ├── layout.tsx              # AuthProvider wrapper
    │   ├── (auth)/                 # login + signup pages
    │   └── (dashboard)/
    │       ├── (editor)/workflows/[workflowId]/page.tsx
    │       └── (rest)/             # workflows, credentials, executions pages
    ├── components/
    │   ├── react-flow/
    │   │   ├── base-node.tsx       # status icons (checkmark/X/spinner)
    │   │   ├── base-handle.tsx
    │   │   ├── node-status-indicator.tsx  # border colors + loading spinner
    │   │   └── placeholder-node.tsx
    │   └── ui/                     # shadcn/ui components
    ├── config/
    │   ├── constants.ts            # NodeType + ExecutionStatus enums (frontend)
    │   └── node-components.ts      # nodeComponents map for React Flow
    ├── features/
    │   ├── auth/
    │   │   ├── components/         # login-form, register-form (eye toggle)
    │   │   ├── store/auth-atoms.ts # currentUserAtom, isAuthenticatedAtom
    │   │   └── components/auth-provider.tsx
    │   ├── credentials/
    │   │   ├── store/credential-atoms.ts
    │   │   ├── hooks/use-credentials.ts
    │   │   └── components/         # credential + credentials UI
    │   ├── editor/
    │   │   ├── components/
    │   │   │   ├── editor.tsx      # React Flow + workflow SSE subscription
    │   │   │   ├── editor-header.tsx
    │   │   │   └── execute-workflow-button.tsx
    │   │   ├── hooks/
    │   │   │   ├── use-execution-stream.ts  # SSE connect + subscribeToWorkflow
    │   │   │   └── use-node-status.ts       # per-node status from atom
    │   │   └── store/
    │   │       ├── atoms.ts                 # editorAtom (ReactFlowInstance)
    │   │       └── execution-atoms.ts       # nodeStatusMapAtom, activeExecutionIdAtom
    │   ├── executions/
    │   │   ├── hooks/use-executions.ts
    │   │   └── components/         # execution + executions UI + all 6 execution nodes
    │   ├── triggers/
    │   │   └── components/         # 3 trigger nodes (manual, google-form, stripe)
    │   ├── subscriptions/
    │   └── workflows/
    │       ├── store/workflow-atoms.ts
    │       ├── hooks/use-workflows.ts
    │       └── components/
    └── hooks/
        ├── use-entity-search.tsx
        ├── use-mobile.ts
        └── use-upgrade-modal.tsx
```

---

## Backend — Setup & Configuration

### Backend Environment Variables

Create `nodebase_backend/.env`:

```env
# Server
PORT=4000
NODE_ENV=development

# PostgreSQL (NeonDB or any Postgres — SSL is always enabled)
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

# JWT — used for httpOnly cookie auth
JWT_SECRET=your-long-random-secret-here
JWT_EXPIRES_IN=7d

# Credential Encryption — must be exactly 32 bytes (64 hex chars)
# Generate with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=a1b2c3d4e5f6...64hexchars...

# CORS — frontend origin
CLIENT_URL=http://localhost:3000

# Inngest — only required in production; in development isDev:true is used automatically
INNGEST_EVENT_KEY=your-inngest-event-key
```

> **Important:** `ENCRYPTION_KEY` must be a 64-character hex string (32 bytes). Changing it after credentials have been stored will make those credentials unreadable.

---

### Backend Dependencies

**Production:**

| Package              | Version  | Purpose                                          |
| -------------------- | -------- | ------------------------------------------------ |
| `express`            | ^5.2.1   | HTTP framework                                   |
| `pg`                 | ^8.19.0  | PostgreSQL client (connection pool)              |
| `jsonwebtoken`       | ^9.0.3   | JWT signing/verification                         |
| `bcryptjs`           | ^3.0.3   | Password hashing (10 rounds)                     |
| `cookie-parser`      | ^1.4.7   | Parse httpOnly JWT cookie                        |
| `cors`               | ^2.8.6   | Cross-origin resource sharing                    |
| `helmet`             | ^8.1.0   | Security HTTP headers                            |
| `express-rate-limit` | ^8.2.1   | Rate limiting per IP                             |
| `dotenv`             | ^17.3.1  | Load `.env` file                                 |
| `zod`                | ^4.3.6   | Request body/params validation                   |
| `uuid`               | ^13.0.0  | UUID v4 primary key generation                   |
| `inngest`            | ^3.52.4  | Durable workflow execution engine                |
| `ai`                 | ^6.0.105 | Vercel AI SDK core                               |
| `@ai-sdk/openai`     | ^3.0.37  | OpenAI provider (gpt-4o-mini)                    |
| `@ai-sdk/google`     | ^3.0.34  | Google provider (gemini-2.5-flash)               |
| `@ai-sdk/anthropic`  | ^3.0.50  | Anthropic provider (claude-sonnet-4)             |
| `handlebars`         | ^4.7.8   | Template resolution (`{{nodes.id.output.text}}`) |
| `html-entities`      | ^2.6.0   | Decode HTML entities after Handlebars rendering  |
| `toposort`           | ^2.0.2   | Topological sort for DAG execution order         |

**Development:**

| Package   | Version | Purpose                      |
| --------- | ------- | ---------------------------- |
| `nodemon` | ^3.1.14 | Auto-restart on file changes |

---

### Database Migrations

All migrations are plain SQL files run in numeric order. The migration runner tracks which have been applied in a `_migrations` table.

```bash
cd nodebase_backend
npm run db:migrate
```

| Migration                    | Creates                                                                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `000_create_extensions`      | `pgcrypto`, `uuid-ossp` extensions                                                                                                                                                                               |
| `001_create_enums`           | `node_type` enum (INITIAL, MANUAL_TRIGGER, HTTP_REQUEST, GOOGLE_FORM_TRIGGER, STRIPE_TRIGGER, ANTHROPIC, GEMINI, OPENAI, DISCORD, SLACK), `execution_status` enum (PENDING, RUNNING, SUCCESS, FAILED, CANCELLED) |
| `002_create_users`           | `user` table (id TEXT PK, email, name, password_hash, timestamps) with RLS                                                                                                                                       |
| `003_create_sessions`        | `session` table for session tracking                                                                                                                                                                             |
| `004_create_accounts`        | `account` table for OAuth accounts                                                                                                                                                                               |
| `005_create_verifications`   | `verification` table                                                                                                                                                                                             |
| `006_create_credentials`     | `credential` table (id TEXT PK, user_id FK, name, type, encrypted_value, iv, auth_tag) with RLS                                                                                                                  |
| `007_create_workflows`       | `workflow` table (id TEXT PK, user_id FK, name, timestamps) with RLS                                                                                                                                             |
| `008_create_nodes`           | `node` table (id TEXT PK, workflow_id FK, type node_type, data JSONB, position_x, position_y) with RLS                                                                                                           |
| `009_create_connections`     | `connection` table (id TEXT PK, workflow_id FK, source_node_id, target_node_id, source_handle, target_handle) with RLS                                                                                           |
| `010_create_executions`      | `execution` table (id TEXT PK, user_id FK, workflow_id FK, status execution_status, result JSONB, error TEXT, timestamps) with RLS                                                                               |
| `011_create_node_executions` | `node_execution` table (id TEXT PK, execution_id FK → TEXT, node_id FK → TEXT, status, output JSONB, error TEXT, timestamps) with RLS using `::text` casts                                                       |

> **Note on RLS:** All tables use PostgreSQL Row-Level Security. Every request runs `SET LOCAL app.current_user_id = '...'` via `client.escapeLiteral()` (parameterized queries are not supported by Postgres `SET LOCAL`) inside a transaction, ensuring users can only access their own data.

---

### Running the Backend

```bash
cd nodebase_backend
npm install
cp .env.example .env     # fill in your values
npm run db:migrate       # run all 12 migrations
npm run dev              # starts nodemon on PORT (default 4000)
```

---

## Frontend — Setup & Configuration

### Frontend Environment Variables

Create `.env.local` in the root `nodebase/` directory:

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# Webhook URL for trigger nodes (use ngrok tunnel in local dev)
# This is displayed inside the Google Form / Stripe trigger dialogs
# so users know where to point their external service.
NEXT_PUBLIC_WEBHOOK_URL=https://your-ngrok-subdomain.ngrok-free.app
```

---

### Frontend Dependencies

**Key additions and their roles:**

| Package                 | Version  | Purpose                                                                                          |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `ky`                    | ^1.12.0  | Lightweight HTTP client replacing tRPC. Configured with `credentials: "include"` for cookie auth |
| `jotai`                 | ^2.15.0  | Atomic state management for auth, workflows, credentials, and real-time execution status         |
| `@xyflow/react`         | ^12.8.6  | React Flow — visual node graph editor                                                            |
| `react-hook-form`       | ^7.64.0  | Form state management for all dialogs                                                            |
| `zod`                   | ^4.1.11  | Frontend schema validation (mirrors backend)                                                     |
| `sonner`                | ^2.0.7   | Toast notifications                                                                              |
| `next`                  | 15.5.4   | App Router with Turbopack                                                                        |
| `react` / `react-dom`   | 19.1.0   | React 19                                                                                         |
| `lucide-react`          | ^0.544.0 | All icons including Eye/EyeOff for password toggles                                              |
| `@tanstack/react-query` | ^5.90.2  | Server state management (retained from original)                                                 |

---

### Running the Frontend

```bash
cd nodebase           # root of the repo
npm install
cp .env.local.example .env.local    # fill in values
npm run dev           # starts Next.js on port 3000 (Turbopack)
```

---

## Inngest Dev Server

Inngest is used as the durable workflow execution engine. In development, you need the Inngest Dev Server running alongside the backend so it can receive and dispatch workflow events.

```bash
cd nodebase_backend
npm run inngest:dev
# runs: npx inngest-cli@latest dev -u http://localhost:4000/api/inngest
```

The `-u` flag tells Inngest exactly where your serve endpoint is, preventing it from probing random paths on your frontend (which causes 404 noise in the browser console).

The Inngest dashboard is available at **http://localhost:8288** — you can inspect events, replay failed functions, and see step-by-step execution traces there.

**How Inngest is used:**

1. `POST /api/workflows/:id/execute` (or a webhook) creates an execution row and fires `workflow/execute` event
2. The Inngest function picks it up, loads the workflow graph + credentials, and runs the engine
3. Each node execution is a durable step — if the process crashes, Inngest resumes from the last completed step
4. The function emits SSE events back to Express via `sseManager` as each node runs

---

## Webhooks (Local Development)

Google Form and Stripe triggers require an externally reachable URL. Use [ngrok](https://ngrok.com) to tunnel your local backend:

```bash
ngrok http 4000
# e.g. output: https://ideographic-arie-hastily.ngrok-free.app
```

Then set in `.env.local`:

```env
NEXT_PUBLIC_WEBHOOK_URL=https://ideographic-arie-hastily.ngrok-free.app
```

This URL is shown inside the Google Form Trigger and Stripe Trigger node configuration dialogs so you can copy it directly into the external service.

**Webhook endpoints (no authentication required):**

| Trigger     | Method | URL                                                              |
| ----------- | ------ | ---------------------------------------------------------------- |
| Google Form | POST   | `http://localhost:4000/api/webhooks/google-form?workflowId=<id>` |
| Stripe      | POST   | `http://localhost:4000/api/webhooks/stripe?workflowId=<id>`      |

Both endpoints:

1. Look up the workflow and its owner
2. Create an `execution` row with status `RUNNING`
3. Fire the `workflow/execute` Inngest event with the trigger payload
4. Return `202 Accepted` immediately

---

## API Reference

All routes are prefixed with `/api`. All routes except `/api/auth/*` and `/api/webhooks/*` require a valid JWT cookie (`Authorization` via httpOnly cookie set at login).

### Auth — `/api/auth`

| Method | Path        | Description                                                        |
| ------ | ----------- | ------------------------------------------------------------------ |
| POST   | `/register` | Create account. Body: `{ name, email, password }`                  |
| POST   | `/login`    | Sign in. Sets `token` httpOnly cookie. Body: `{ email, password }` |
| POST   | `/logout`   | Clear auth cookie                                                  |
| GET    | `/me`       | Return current authenticated user                                  |

### Workflows — `/api/workflows`

| Method | Path           | Description                                                                              |
| ------ | -------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/`            | List workflows with pagination (`?page=1&pageSize=10`)                                   |
| POST   | `/`            | Create workflow. Body: `{ name }`                                                        |
| GET    | `/:id`         | Get workflow with nodes and connections                                                  |
| PATCH  | `/:id/name`    | Rename workflow. Body: `{ name }`                                                        |
| PUT    | `/:id`         | Save full workflow (delete-and-reinsert nodes/connections). Body: `{ nodes[], edges[] }` |
| DELETE | `/:id`         | Delete workflow                                                                          |
| POST   | `/:id/execute` | Start execution (creates execution row + fires Inngest event)                            |
| GET    | `/:id/stream`  | SSE stream — notifies open editors when any execution starts on this workflow            |

### Credentials — `/api/credentials`

| Method | Path          | Description                                                    |
| ------ | ------------- | -------------------------------------------------------------- |
| GET    | `/`           | List credentials (encrypted values never returned)             |
| POST   | `/`           | Create credential. Body: `{ name, type, value }`               |
| GET    | `/:id`        | Get credential metadata                                        |
| PATCH  | `/:id`        | Update credential. Body: `{ name?, value? }`                   |
| DELETE | `/:id`        | Delete credential                                              |
| GET    | `/type/:type` | Get credentials by type (e.g. `OPENAI`, `GEMINI`, `ANTHROPIC`) |

### Executions — `/api/executions`

| Method | Path          | Description                                                 |
| ------ | ------------- | ----------------------------------------------------------- |
| GET    | `/`           | List executions with pagination                             |
| GET    | `/:id`        | Get execution details                                       |
| GET    | `/:id/nodes`  | Get per-node execution results                              |
| GET    | `/:id/stream` | SSE stream — real-time node status events for one execution |

### Webhooks — `/api/webhooks` (no auth)

| Method | Path                       | Description                                            |
| ------ | -------------------------- | ------------------------------------------------------ |
| POST   | `/google-form?workflowId=` | Trigger workflow execution from Google Form submission |
| POST   | `/stripe?workflowId=`      | Trigger workflow execution from Stripe event           |

### Nodes & Connections — `/api/nodes`, `/api/connections`

Full CRUD used internally by the workflow save/load flow.

---

## Workflow Engine

The engine (`src/engine/`) runs workflows as a directed acyclic graph (DAG).

### Execution Order — `toposort.js`

Nodes are sorted into a linear execution order respecting all edge dependencies. If node B depends on output from node A, A always runs first. Circular dependencies throw an error before execution begins.

### Template Resolution — `template.js`

Before a node runs, all string fields in its `data` object are processed through Handlebars. This lets node configuration reference outputs from previously executed nodes:

```
"userPrompt": "Summarise this form response: {{json nodes.abc123.output}}"
```

**Custom Handlebars helpers registered:**

- `{{json value}}` — serialises any value to a pretty-printed JSON string
- `{{encodeURI value}}` — URI-encodes a string
- `{{#eq a b}}...{{/eq}}` — equality block helper

### Runner — `runner.js`

The `runWorkflow()` function:

1. Calls `toposort` to get ordered node IDs
2. Skips `INITIAL` placeholder nodes
3. For each node: resolves templates → calls the executor → stores output in `context.nodes[nodeId]`
4. At each step calls `onNodeStart`, `onNodeComplete`, or `onNodeError` callbacks
5. The Inngest function wires these callbacks to both database updates and SSE events

---

## Node Types & Executors

### Trigger Nodes (start the workflow)

| Node                    | Executor                 | Behaviour                                             |
| ----------------------- | ------------------------ | ----------------------------------------------------- |
| **Manual Trigger**      | `manual-trigger.js`      | Pass-through. Used for the "Execute workflow" button. |
| **Google Form Trigger** | `google-form-trigger.js` | Receives `triggerPayload.formData` from the webhook.  |
| **Stripe Trigger**      | `stripe-trigger.js`      | Receives `triggerPayload.event` from the webhook.     |

### Execution Nodes (do the work)

| Node             | Executor          | Model / Service                    | Credential Type         |
| ---------------- | ----------------- | ---------------------------------- | ----------------------- |
| **HTTP Request** | `http-request.js` | Configurable method, URL, body     | None                    |
| **OpenAI**       | `openai.js`       | `gpt-4o-mini` (Vercel AI SDK)      | `OPENAI`                |
| **Anthropic**    | `anthropic.js`    | `claude-sonnet-4` (Vercel AI SDK)  | `ANTHROPIC`             |
| **Gemini**       | `gemini.js`       | `gemini-2.5-flash` (Vercel AI SDK) | `GEMINI`                |
| **Discord**      | `discord.js`      | Webhook message                    | `DISCORD` (webhook URL) |
| **Slack**        | `slack.js`        | Webhook message                    | `SLACK` (webhook URL)   |

**AI node configuration (shared by OpenAI, Anthropic, Gemini):**

- `credentialId` — references a saved credential for the API key
- `systemPrompt` _(optional)_ — sets the AI's role/behaviour
- `userPrompt` _(required)_ — the actual prompt, supports `{{template}}` expressions
- `variableName` — the key under which this node's output is accessible to downstream nodes as `{{nodes.<variableName>.output.text}}`

---

## Real-Time Execution Status (SSE)

Nodes in the editor show live execution status with no polling:

| Status  | Visual                                         |
| ------- | ---------------------------------------------- |
| Running | Blue animated border + spinner overlay         |
| Success | Green border + ✓ checkmark icon (bottom-right) |
| Error   | Red border + ✗ icon (bottom-right)             |

### How it works

**Two-level SSE architecture:**

1. **Execution-level stream** (`GET /api/executions/:id/stream`)
   - Opened once an execution ID is known
   - Events: `node:start`, `node:complete`, `node:error`, `execution:complete`, `execution:error`
   - Updates `nodeStatusMapAtom` in Jotai → each node component re-renders with new status

2. **Workflow-level stream** (`GET /api/workflows/:id/stream`)
   - Opened automatically when the editor mounts, stays alive the whole session
   - Event: `execution:started` — fires when _any_ execution begins on this workflow
   - Auto-triggers the execution-level subscription with the new `executionId`

**Why two levels?** The "Execute workflow" button knows the `executionId` immediately (it gets it from the API response). But webhook triggers (Google Form, Stripe) run externally — the browser never learns the `executionId` without the workflow-level channel. The workflow stream bridges this gap.

### SSEManager (`src/modules/executions/sse.js`)

A singleton class that maintains two `Map`s:

- `connections`: `executionId → Response[]`
- `workflowConnections`: `workflowId → Response[]`

The Inngest function holds a direct reference to `sseManager` and calls `send()` / `sendWorkflow()` / `close()` as execution progresses.

---

## Authentication

Authentication uses **JWT stored in httpOnly cookies**, not `Authorization` headers.

**Login flow:**

1. `POST /api/auth/login` → verifies password with `bcryptjs.compare` → signs JWT with `JWT_SECRET` → sets `token` cookie (`httpOnly: true, sameSite: "lax"`)
2. All subsequent requests include the cookie automatically (browser-native)
3. `verifyToken` middleware extracts and verifies the JWT, attaches `req.user`

**Why cookies over Bearer tokens:**

- httpOnly cookies are not accessible from JavaScript — XSS cannot steal them
- Automatic inclusion by the browser — no token management in frontend code
- Works naturally with SSE (`EventSource` always sends cookies on same-origin requests)

**Frontend:**

- `ky` is configured with `credentials: "include"` so all API requests send the cookie
- `EventSource` is created with `{ withCredentials: true }` for the same reason
- `AuthProvider` calls `getMe()` on mount to hydrate `currentUserAtom`; on 401 the atom is set to `null` and the user is redirected to login

---

## Credential Encryption

API keys and webhook secrets stored in credentials are encrypted at rest using **AES-256-GCM**.

**Encryption details (`src/utils/encryption.js`):**

- Algorithm: `aes-256-gcm`
- Key: 32-byte buffer derived from `ENCRYPTION_KEY` hex string
- IV: 16 random bytes generated per encryption, stored alongside ciphertext
- Auth tag: 16 bytes, stored alongside ciphertext
- Storage: `encrypted_value` (hex), `iv` (hex), `auth_tag` (hex) columns in `credential` table

**Decryption at execution time:**
The `getCredentialsForWorkflow()` service decrypts all credentials needed by a workflow's nodes during the Inngest `load-workflow` step, passing plain-text values to executors in memory only — decrypted values are never persisted.

---

## Key Architectural Decisions

### Why a separate Express backend instead of Next.js API routes?

- **Server-Sent Events (SSE)**: Next.js API routes run in Vercel's edge/serverless environment which does not support persistent TCP connections. SSE requires a long-lived connection that only a traditional server can provide.
- **Inngest integration**: The Inngest background function holds a live reference to `sseManager` (in-process singleton). This only works in a persistent Node.js process.
- **Database transactions with RLS**: Using `SET LOCAL` for row-level security requires a real connection pool that can hold clients across transaction boundaries.
- **Full control**: No edge runtime restrictions, no 10-second function timeouts, no cold starts.

### Why Jotai instead of keeping TanStack Query for everything?

- Execution status (SSE events) is push-based, not request-based. TanStack Query polls or refetches; it is not designed for live SSE streams.
- Jotai atoms are the ideal store for `nodeStatusMap` — they are fine-grained (each node subscribes to only its own status), synchronous, and update-friendly.
- TanStack Query is still used where appropriate (list views, detail pages).

### Why Inngest instead of running executors directly?

- Durability: if the server restarts mid-execution, Inngest resumes from the last completed step.
- Retryability: individual steps can be retried without re-running the whole workflow.
- Observability: the Inngest Dev Server UI shows every event, step, and output.
- Decoupling: the HTTP request that starts a workflow returns in `<50ms`; execution happens in the background.

### Handlebars for templating

Node configuration fields support `{{nodes.<nodeId>.output.text}}` expressions. This lets users chain outputs between nodes — e.g. feed a Google Form response directly into a Gemini prompt — without any code. Handlebars was chosen for its well-understood syntax, safety (no arbitrary code execution), and ease of extending with custom helpers.

---

## What Was Removed

The following were completely removed as part of this migration:

| Removed                                                         | Replaced with                                              |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| **tRPC** (client, server, routers, init, query-client)          | Direct REST calls via `ky`                                 |
| **Prisma** (schema, client, 12 migration files)                 | Raw SQL via `pg` Pool + custom migration runner            |
| **BetterAuth** (auth.ts, auth-client.ts, API route)             | Custom JWT + bcryptjs authentication                       |
| **Sentry** (instrumentation, configs, example page, API route)  | Custom structured JSON logger                              |
| **Polar** (subscriptions Polar client)                          | Subscription hook stubbed                                  |
| **Inngest client-side** (channels, functions, utils, API route) | Inngest moved entirely to backend                          |
| **Next.js API routes for webhooks**                             | Express webhook module (required for SSE singleton access) |
| **Server-side `prefetch` / `params-loader` files**              | Hook-based data fetching via `ky` API layer                |
| **mprocs** (process manager config)                             | Separate terminal tabs or `concurrently`                   |
