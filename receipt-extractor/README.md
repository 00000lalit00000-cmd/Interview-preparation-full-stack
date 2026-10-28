[⬅ Back](../README.md)

[⬅ Return to Root README](../README.md)

# Receipt Extractor — Full-Stack Application

A full-stack application that accepts images of receipts, uses **Azure Document Intelligence** to extract structured data (vendor, date, items, tax, total), and displays the results in a React dashboard.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Architecture Decisions](#architecture-decisions)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Infrastructure (Docker)](#1-infrastructure-docker)
  - [Backend](#2-backend)
  - [Frontend](#3-frontend)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Architecture Overview

```
┌──────────────┐        REST / SSE        ┌──────────────────┐
│   React SPA  │ ◄──────────────────────► │   NestJS API     │
│  (Vite)      │   http://localhost:5173   │  :3000           │
└──────────────┘                           └────────┬─────────┘
                                                    │
                                  ┌─────────────────┼──────────────────┐
                                  │                 │                  │
                          ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────────┐
                          │  PostgreSQL  │  │    Redis     │  │  Azure Blob      │
                          │  (TypeORM)   │  │  (BullMQ)    │  │  Storage         │
                          └──────────────┘  └──────┬───────┘  └──────────────────┘
                                                   │
                                            ┌──────▼───────────────────┐
                                            │  BullMQ Worker           │
                                            │  (ExtractionProcessor)   │
                                            │         │                │
                                            │  Azure Document          │
                                            │  Intelligence            │
                                            └──────────────────────────┘
```

1. User uploads a receipt image via the React frontend.
2. The NestJS API stores the image in **Azure Blob Storage** and persists a record in **PostgreSQL**.
3. An extraction job is enqueued into a **BullMQ** queue (backed by **Redis**).
4. The **ExtractionProcessor** worker picks up the job, retrieves the image, and sends it to **Azure Document Intelligence** (`prebuilt-receipt` model).
5. Extraction results are saved back to the database, and an **SSE (Server-Sent Events)** notification is pushed to the frontend in real time.
6. The frontend updates the receipt status live without polling.

---

## Architecture Decisions

### Backend

| Decision | Rationale |
|---|---|
| **NestJS** | Provides a modular, testable architecture with built-in DI, validation pipes, and first-class TypeScript support — ideal for enterprise-grade APIs. |
| **TypeORM with PostgreSQL** | Mature ORM with decorator-based entity definitions; PostgreSQL was chosen for its robust JSONB support (receipt line items) and reliability. |
| **BullMQ + Redis for async extraction** | Receipt extraction is a long-running I/O operation. Offloading it to a background queue keeps the upload endpoint fast and responsive, provides automatic retries, and decouples ingestion from processing. |
| **Strategy Pattern for extraction** | `IExtractionStrategy` interface abstracts the extraction provider. The current implementation uses `AzureDocumentIntelligenceStrategy`, but swapping to another AI provider (e.g., Google Document AI, AWS Textract) requires only a new strategy class — no changes to the processor or service layer. |
| **Azure Document Intelligence (prebuilt-receipt)** | Purpose-built model for receipts with high accuracy for vendor name, date, line items, tax, and totals. No model training required. |
| **Azure Blob Storage** | Scalable object storage for receipt images. Keeps binary data out of the database and enables streaming delivery to the frontend. |
| **Server-Sent Events (SSE)** | Lightweight, unidirectional push mechanism — perfect for notifying the frontend of extraction completion without the overhead of WebSockets. |
| **DTO validation with class-validator** | Request payloads are validated and transformed using `class-validator` / `class-transformer` via NestJS `ValidationPipe`, ensuring data integrity at the API boundary. |
| **Global `ValidationPipe` with whitelist** | `whitelist: true` and `forbidNonWhitelisted: true` strip/reject unknown properties, preventing mass-assignment vulnerabilities. |

### Frontend

| Decision | Rationale |
|---|---|
| **React 19 + Vite** | Fast HMR dev experience and optimized production builds. Vite's ESM-first approach significantly improves DX. |
| **Material UI (MUI)** | Comprehensive, accessible component library that accelerates UI development with a consistent design system. |
| **Custom hooks (`useReceipts`, `useUserId`)** | Encapsulate data-fetching, state management, and side effects, keeping components thin and focused on presentation. |
| **SSE integration** | Real-time extraction status updates are consumed via `EventSource`, enabling the UI to reactively reflect backend processing without polling. |
| **API client class (`ReceiptClient`)** | Centralised HTTP layer with timeout handling and abort controller — single place to manage base URL, error handling, and request configuration. |
| **Error boundaries + toast notifications** | Graceful degradation for unexpected errors; toast notifications for user-facing feedback on async operations. |
| **UUID-based anonymous user identity** | A random UUID is generated and persisted in `localStorage` to scope receipts per browser session without requiring authentication. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Material UI |
| Backend | NestJS 10, TypeScript, TypeORM |
| Database | PostgreSQL 16 |
| Queue | BullMQ (Redis 7) |
| Storage | Azure Blob Storage |
| AI/OCR | Azure Document Intelligence (prebuilt-receipt) |
| Testing | Jest (backend), Vitest + React Testing Library (frontend) |

---

## Prerequisites

- **Node.js** v18+ and **npm** v10+
- **Docker** & **Docker Compose** (for PostgreSQL and Redis)
- An **Azure** account with:
  - A **Blob Storage** account + container
  - A **Document Intelligence** resource (endpoint + API key)

---

## Environment Variables

Create a `.env` file in `extractor-backend/` with the following variables:

```env
# Server
PORT=3000

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/receipt_extractor

# Redis
REDIS_URL=redis://localhost:6379

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=<your-azure-storage-connection-string>
AZURE_STORAGE_CONTAINER_NAME=<your-container-name>

# Azure Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=<your-endpoint-url>
AZURE_DOCUMENT_INTELLIGENCE_API_KEY=<your-api-key>
```

The frontend uses a single optional variable (defaults to `http://localhost:3000`):

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## Getting Started

### 1. Infrastructure (Docker)

Start PostgreSQL and Redis using Docker Compose:

```bash
cd extractor-backend
docker-compose up -d
```

This spins up:
- **PostgreSQL 16** on port `5432` (user: `postgres`, password: `postgres`, db: `receipt_extractor`)
- **Redis 7** on port `6379`

### 2. Backend

```bash
cd extractor-backend
npm install
npm run start:dev       # development (watch mode)
# or
npm run build && npm run start:prod   # production
```

The API server starts on **http://localhost:3000** (configurable via `PORT`).

TypeORM will auto-synchronize the database schema on first run (development mode).

### 3. Frontend

```bash
cd extractor-frontend
npm install
npm run dev
```

The Vite dev server starts on **http://localhost:5173**. Open this URL in your browser.

---

## API Endpoints

All endpoints are prefixed with `/receipts`.

### Upload a Receipt

```
POST /receipts
```

| Parameter | Location | Type | Description |
|---|---|---|---|
| `file` | form-data | `File` | Receipt image file (required) |
| `userId` | form-data | `string` | User identifier (required) |

**Response** `200 OK`
```json
{
  "success": true,
  "receipt": {
    "id": "uuid",
    "originalName": "receipt.jpg",
    "status": "extracting",
    "createdAt": "2026-02-20T...",
    "imageUrl": "..."
  }
}
```

---

### List Receipts

```
GET /receipts?userId={userId}
```

**Response** `200 OK`
```json
{
  "receipts": [
    {
      "id": "uuid",
      "originalName": "receipt.jpg",
      "status": "extracted",
      "createdAt": "2026-02-20T...",
      "imageUrl": "..."
    }
  ]
}
```

---

### Get Receipt Details

```
GET /receipts/:id
```

**Response** `200 OK`
```json
{
  "receipt": {
    "id": "uuid",
    "originalName": "receipt.jpg",
    "status": "extracted",
    "createdAt": "2026-02-20T...",
    "imageUrl": "...",
    "details": {
      "vendorName": "Store Name",
      "date": "2026-01-15",
      "currency": "USD",
      "items": [
        { "name": "Item A", "amount": 9.99 },
        { "name": "Item B", "amount": 4.50 }
      ],
      "tax": 1.16,
      "total": 15.65
    },
    "failureReason": null
  }
}
```

---

### Get Receipt Image

```
GET /receipts/:id/image
```

Returns the receipt image as a binary stream with `Content-Type: image/jpeg`.

---

### Delete a Receipt

```
DELETE /receipts/:id?userId={userId}
```

**Response** `204 No Content`

---

### Real-Time Extraction Events (SSE)

```
GET /receipts/events?userId={userId}
```

Opens a **Server-Sent Events** stream. The server pushes events when a receipt's extraction status changes:

```json
{
  "userId": "...",
  "receiptId": "uuid",
  "status": "extracted"
}
```

---

## Testing

### Backend

```bash
cd extractor-backend
npm test              # unit tests
npm run test:cov      # with coverage
npm run test:e2e      # end-to-end tests
```

### Frontend

```bash
cd extractor-frontend
npm test              # unit tests (Vitest)
npm run test:coverage # with coverage
npm run test:ui       # interactive Vitest UI
```

---

## Project Structure

```
├── README.md                          # ← You are here
├── requirements.md                    # Project brief
├── new-receipts/                      # Receipt images for testing
│
├── extractor-backend/
│   ├── docker-compose.yml             # PostgreSQL + Redis
│   ├── package.json
│   ├── src/
│   │   ├── main.ts                    # App bootstrap, CORS, validation pipe
│   │   ├── app.module.ts              # Root module (Config, DB, BullMQ, Receipts)
│   │   ├── config.ts                  # Centralised env-var loading & validation
│   │   ├── database/
│   │   │   ├── database.module.ts     # TypeORM connection setup
│   │   │   └── entities/
│   │   │       └── receipt-extraction.entity.ts  # Receipt entity (status, items, etc.)
│   │   ├── receipts/
│   │   │   ├── receipts.controller.ts # REST + SSE endpoints
│   │   │   ├── receipts.module.ts     # Feature module wiring
│   │   │   ├── dto/                   # Request/response DTOs with validation
│   │   │   ├── interfaces/            # IExtractionStrategy, job payload types
│   │   │   └── services/
│   │   │       ├── receipts.service.ts          # Core CRUD + queue dispatch
│   │   │       ├── receipt-events.service.ts    # In-process SSE event bus
│   │   │       ├── extraction-strategies/
│   │   │       │   └── azure-document-intelligence.strategy.ts  # AI extraction
│   │   │       └── processors/
│   │   │           └── extraction.processor.ts  # BullMQ worker
│   │   └── storage/
│   │       ├── storage.module.ts
│   │       └── storage.service.ts     # Azure Blob Storage wrapper
│   └── test/                          # E2E tests
│
├── extractor-frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx                   # App entry point
│   │   ├── App.tsx                    # Root component
│   │   ├── api/
│   │   │   └── receipt.ts             # Centralised API client
│   │   ├── components/
│   │   │   ├── ErrorBoundary.tsx      # Global error boundary
│   │   │   ├── common/
│   │   │   │   └── ToastContainer.tsx # Toast notification system
│   │   │   └── receipts/
│   │   │       ├── ReceiptsPage.tsx          # Main dashboard page
│   │   │       ├── ReceiptList.tsx           # Receipt cards list
│   │   │       ├── ReceiptDetailsModal.tsx   # Extraction results modal
│   │   │       ├── NewExtractionModal.tsx    # Upload dialog
│   │   │       └── DeleteConfirmationModal.tsx
│   │   ├── constants/
│   │   │   └── config.ts             # API base URL, endpoints, timeouts
│   │   ├── hooks/
│   │   │   ├── useReceipts.ts         # Receipt CRUD + SSE hook
│   │   │   └── useUserId.ts           # Anonymous user identity hook
│   │   ├── types/
│   │   │   └── receipt.ts             # TypeScript interfaces
│   │   └── utils/
│   │       └── formatters.ts          # Display formatting helpers
│   └── vitest.config.ts
```

---

## Folder Description

This folder contains a receipt extraction application with backend and frontend components. It demonstrates building a full-stack application for extracting information from receipts.

**[⬅ Return to Root README](../README.md)**
