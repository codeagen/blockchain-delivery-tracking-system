# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is a **greenfield project**. The `backend/`, `blockchain/`, and `frontend/` directories
currently exist but are **empty** — no code, `package.json`, or build tooling has been scaffolded
yet. The only committed artifact is `chama_seminar_defence_complete.txt`, the seminar report that
specifies the intended design.

When asked to "build" or "implement" features, you are expected to scaffold the relevant tier from
scratch following the architecture below. Confirm the intended scope before generating large amounts
of boilerplate.

## What the project is

A **blockchain-based delivery management system** (University of Ilorin CS seminar project by
Adeleye Muaadh Adeniyi, 21/52HA016). Goal: record every delivery event (creation → dispatch →
transit → confirmed receipt) on an Ethereum ledger so the delivery history is tamper-proof and
independently verifiable by all parties, removing the trust gap in centralized delivery tracking.

Three user roles drive all business logic and access control: **seller** (creates delivery orders),
**delivery agent** (dispatches, updates transit status), and **customer** (confirms receipt). Role-
based access control is a core requirement, not an afterthought.

## Intended architecture (three tiers, one per top-level directory)

The design is a strict three-tier split. Keep these concerns in their own directories.

- **`blockchain/`** — Solidity smart contracts (the source of truth). Contracts emit events for
  dispatch, transit, and delivery confirmation, and enforce that only the correct role can trigger
  each state transition. Tooling: **Hardhat** for compile/deploy, **Ganache** as the local Ethereum
  network, **Mocha/Chai** for contract unit tests. Deploy target is an Ethereum test network.

- **`backend/`** — **NestJS + TypeScript** REST API. This is the only tier that talks to the chain
  (via **Web3.js**). Responsibilities: JWT auth, role-based access control, delivery business logic,
  signing/submitting transactions to the smart contracts, and storing transaction hashes off-chain
  for fast lookup. Follow NestJS conventions: controllers route requests, services hold logic and
  own the blockchain integration, modules group features.

- **`frontend/`** — **Next.js (App Router) + TypeScript**. Talks only to the backend REST API (via
  Axios or `fetch`) — never directly to the chain. Screens: register/login, seller delivery creation,
  customer/agent tracking dashboard, status notifications. Keep blockchain logic out of this tier:
  even server-side code (route handlers, server actions) should call the NestJS backend, not Web3
  directly, so all chain interaction stays centralized in the backend.

### Key architectural rules

- **The chain is the system of record.** Any database in the backend is an *off-chain cache* for
  speed (user records, transaction-hash lookups) — it must never be the authoritative delivery
  state. Delivery state lives on-chain.
- **Layering is one-directional:** frontend → backend → blockchain. The frontend must not contain
  Web3 calls; all chain interaction is centralized in backend services.
- **State transitions are role-gated** both in the smart contract and in the backend, mirroring the
  delivery lifecycle: seller creates order → agent assigned → agent dispatches → in transit → customer
  confirms receipt (which closes the agent's responsibility on the ledger).

## Build / test commands

None exist yet — there is no `package.json` in any tier. When scaffolding, the design document
specifies this toolchain, so wire commands to match:

- Smart contracts: Hardhat (`npx hardhat compile`, `npx hardhat test`, `npx hardhat node` /
  Ganache for local chain, `npx hardhat run scripts/deploy.ts`).
- Backend: standard NestJS scripts (`npm run start:dev`, `npm run test`).
- Frontend: standard Next.js scripts (`npm run dev`, `npm run build`, `npm start`, `npm run lint`;
  tests via Jest + React Testing Library).

Update this section with the real, verified commands once each tier is scaffolded.

## Reference

`chama_seminar_defence_complete.txt` is the authoritative spec — consult its **System Framework**
(architecture, components) and **System Methodology** (delivery lifecycle, data flow, ERD entities:
Users, Delivery Orders, Blockchain Transactions) sections before making design decisions, so the
implementation stays consistent with what is being defended academically.


## Delivery Lifecycle (strict order, no skipping, no reversing)
1. Seller calls createDelivery() → status: CREATED
2. Admin/system assigns agent → status: ASSIGNED
3. Agent marks dispatched → status: DISPATCHED
4. Agent marks in transit → status: IN_TRANSIT
5. Customer confirms receipt → status: DELIVERED

## Smart Contract Access Control Rules
- Only seller can call createDelivery()
- Only admin/system can call assignAgent()
- Only the assigned agent can call updateStatus()
- Only the assigned customer can call confirmDelivery()
- getDelivery() is read-only, accessible to all roles
- Unauthorized calls must revert with a clear error message
- Once status is DELIVERED, no further updates are allowed

## Scope Boundaries — Do NOT add these
- No GPS or real-time location tracking
- No payment processing or escrow
- No IoT or RFID integration
- No mobile app
- No Ethereum mainnet deployment (Ganache local only)

## Academic Requirement
This is a real, functional implementation for undergraduate final year 
submission. Nothing should be mocked or faked. Every delivery status 
update must go through the smart contract — never stored only in the 
database.`

## Code Quality Rules
- Write modular code — one responsibility per file
- Follow NestJS official style guidelines (controllers, services, modules strictly separated)
- Follow Solidity best practices (checks-effects-interactions pattern, emit events, revert with messages)
- Next.js pages and components must be small and single-purpose
- Use the Next.js App Router (app/ directory) — not the Pages Router
- No business logic in controllers, components, or pages — logic stays in services
- Every function must have a clear comment explaining what it does
- Use TypeScript strictly — no `any` types
- All API calls from Next.js must go through the NestJS backend — never call the blockchain directly from Next.js