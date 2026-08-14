# Veridel

A blockchain-based delivery management system where proof of delivery is recorded on-chain and confirmed by the customer, not the courier.

<!-- TODO: add a screenshot or short GIF here. Even one image of the tracking view
     roughly doubles how long a reviewer spends on a README.
     Syntax: ![Delivery tracking view](docs/screenshot.png) -->

## The problem

Delivery disputes come down to one party's word against another's. The courier says it was handed over; the customer says it never arrived; the seller has no way to adjudicate. Every party keeps its own records, and the records that matter most — who confirmed receipt, and when — sit in a database that one of the interested parties controls and can edit.

Veridel makes each stage of the delivery lifecycle an event on a shared ledger no single party owns. The final stage requires the customer's own confirmation, so completion cannot be asserted unilaterally, and no participant can rewrite the sequence after the fact.

## Design decisions worth noting

**Custodial wallets.** Users sign in with email and password. The system manages Ethereum wallets server-side, so no participant handles a seed phrase or funds gas. This trades some decentralization for the only adoption model that works for sellers and couriers who have no reason to learn what a wallet is — the audit trail is still tamper-evident, which is the property the problem actually needs.

**On-chain events, off-chain data.** The blockchain records state transitions and their actors. Addresses, contact details, and package descriptions live in Postgres. Putting everything on-chain would be expensive, slow, and would publish customer data permanently.

**Customer-confirmed completion.** The transition to `Delivered` is authorized by the recipient, not the agent. This is the single design point the rest of the system exists to support.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Next.js   │────▶│   NestJS    │────▶│  Ethereum        │
│  frontend   │     │   backend   │     │  smart contract  │
└─────────────┘     └──────┬──────┘     └──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    └─────────────┘
```

The backend is the only component that talks to the chain. The frontend never holds keys or signs anything.

## Delivery lifecycle

| Stage | Triggered by | Recorded on-chain |
|-------|--------------|-------------------|
| Created | Seller | Yes |
| Assigned | Seller / Admin | Yes |
| Dispatched | Delivery agent | Yes |
| In Transit | Delivery agent | Yes |
| Delivered | **Customer** | Yes |

## Roles

- **Seller** — creates deliveries, assigns agents, tracks status
- **Delivery agent** — accepts assignments, advances dispatch and transit stages
- **Customer** — tracks their delivery, confirms receipt
- **Admin** — oversees users and deliveries across the platform

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js, TypeScript |
| Backend | NestJS, TypeScript, TypeORM |
| Database | PostgreSQL |
| Contracts | Solidity, Hardhat |
| Chain | <!-- TODO: which network? Hardhat local, Sepolia, Polygon Amoy? --> |

## Getting started

### Prerequisites

- Node.js <!-- TODO: version --> and npm
- PostgreSQL <!-- TODO: version -->
- <!-- TODO: anything else — a testnet RPC URL, a funded account? -->

### Setup

```bash
git clone https://github.com/codeagen/blockchain-delivery-tracking-system.git
cd blockchain-delivery-tracking-system
```

<!-- TODO: replace the three blocks below with your actual commands.
     Verify each one by running it in a fresh clone before you publish —
     a README whose setup steps fail is worse than no README. -->

**Contracts**

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat node          # local chain
npx hardhat run scripts/deploy.ts --network localhost
```

**Backend**

```bash
cd backend
npm install
cp .env.example .env      # TODO: commit a .env.example if you haven't
npm run migration:run     # TODO: confirm the actual script name
npm run start:dev
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

### Environment variables

<!-- TODO: list the variables and what each is for. Names and purposes only,
     never values. Example rows below — replace with your real ones. -->

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signing key for auth tokens |
| `RPC_URL` | Ethereum node endpoint |
| `CONTRACT_ADDRESS` | Deployed delivery contract |

## Project structure

```
├── backend/      NestJS API, TypeORM entities and migrations
├── blockchain/   Solidity contracts, Hardhat config and deploy scripts
└── frontend/     Next.js application
```
