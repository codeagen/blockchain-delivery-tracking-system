# Deployment guide

How to take the system online: **frontend + backend + database** on normal
hosts, and the **smart contract** on the public **Sepolia** test network (so a
hosted backend can reach it — a local Ganache node cannot be reached from the
internet).

> Scope note: the project brief says "Ganache local only." Sepolia is a public
> **test** network (free, fake ETH) — it is **not mainnet**, so it doesn't break
> the "no mainnet" rule, but it does go beyond local-only. This is the only way
> to make the chain reachable by a hosted backend.

## Mental model (read once)

You don't host a blockchain — Ethereum already runs 24/7. You only **publish your
one contract onto it** and point the backend at it through an **RPC provider**
(a gateway URL). The same `DeliveryManagement.sol` you run on Ganache locally is
deployed unchanged to Sepolia.

## Deploy order

1. **Blockchain** — deploy the contract to Sepolia, get its address. *(Part A)*
2. **Database** — a managed Postgres. *(Part B)*
3. **Backend** — NestJS, wired to the DB + the Sepolia contract. *(Part C)*
4. **Frontend** — Next.js, wired to the backend URL. *(Part D)*

---

## Part A — Smart contract → Sepolia

Everything here happens in the `blockchain/` folder.

### A1. Get a Sepolia RPC URL (free)
1. Create a free account at **Alchemy** (alchemy.com) — or Infura.
2. Create a new app, network **Ethereum → Sepolia**.
3. Copy its **HTTPS** URL. It looks like
   `https://eth-sepolia.g.alchemy.com/v2/XXXXXXXX`.

### A2. Make a throwaway deployer wallet
This wallet deploys the contract **and** becomes the contract admin, and the
backend reuses it to fund users' gas. Use a brand-new wallet — never one with
real money.

Generate one from the `blockchain/` folder:
```bash
node -e "const {Wallet}=require('ethers');const w=Wallet.createRandom();console.log('address: '+w.address);console.log('privateKey: '+w.privateKey)"
```
Save both the **address** and the **privateKey** somewhere safe.

### A3. Fund it with Sepolia test ETH (free)
Use a Sepolia faucet, paste the **address** from A2:
- Google Cloud faucet: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- Alchemy faucet: https://www.alchemy.com/faucets/ethereum-sepolia

Wait until the balance shows up (a minute or two). A little goes a long way.

### A4. Configure the deploy
In `blockchain/`, copy the template and fill it in:
```bash
cp .env.example .env
```
Edit `blockchain/.env`:
```
SEPOLIA_RPC_URL=<the HTTPS URL from A1>
SEPOLIA_PRIVATE_KEY=<the privateKey from A2>
```

### A5. Deploy
```bash
npm run deploy:sepolia
```
It prints:
```
DeliveryManagement deployed to: 0x.....   <-- COPY THIS (the contract address)
Contract admin (deployer): 0x.....
```
**Copy the contract address.** You now have the three values the backend needs:
- **RPC URL** (A1)
- **Contract address** (A5)
- **Deployer private key** (A2) — this is the backend's signer/admin key.

---

## Part B — Database (Postgres)

Create a managed Postgres (Neon, Render Postgres, Railway, Supabase…). Note the
connection details — you'll feed them to the backend as `DB_*` env vars. Create
an empty database named e.g. `blockchain_delivery`.

---

## Part C — Backend (NestJS)

Deploy `backend/` as a Node web service (Render, Railway, Fly.io…).

- **Build:** `npm install && npm run build`
- **Start:** `npm run start:prod`  (runs `node dist/main`)
- **Health/docs:** once live, open `https://<backend>/docs` (Swagger).

### Backend environment variables
Set these in the host's dashboard (values from the steps above):
```
PORT=3001                       # or whatever the host injects
DB_HOST=...                     # from Part B
DB_PORT=5432
DB_USERNAME=...
DB_PASSWORD=...
DB_NAME=blockchain_delivery
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=1d
RPC_URL=<Sepolia RPC URL from A1>
CONTRACT_ADDRESS=<deployed address from A5>
SIGNER_PRIVATE_KEY=<deployer private key from A2>
```

> **Important wiring:** `SIGNER_PRIVATE_KEY` must be the **same** key that
> deployed the contract (A2). The deployer is the contract admin (the only
> account allowed to `assignAgent`), and the backend also uses it to fund each
> user's custodial wallet for gas. Keep that wallet topped up with test ETH
> (re-run the faucet if it runs low), or seller/agent actions fail on gas.

> **CORS:** the backend currently allows all origins (`app.enableCors()`). That
> works as-is. To lock it to your frontend only, change `main.ts` to
> `app.enableCors({ origin: 'https://<your-frontend-domain>' })`.

---

## Part D — Frontend (Next.js)

Deploy `frontend/` to Vercel (or any Next.js host).

Set **one** environment variable:
```
NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api
```
> Note the **`/api`** suffix — the backend serves every route under the `api`
> global prefix. Without it, all API calls 404.

Redeploy after setting it (env vars are baked in at build time for
`NEXT_PUBLIC_*`).

---

## Final check (end-to-end)

1. Open the frontend URL → landing page loads.
2. Go to `/register`, create a **Seller**, a **Customer**, and an **Agent**.
   - Each registration should succeed and route to that role's dashboard.
   - If register hangs/fails: backend not reachable or `NEXT_PUBLIC_API_URL`
     missing `/api`, or DB not connected.
3. As Seller, create a delivery to the Customer's address.
   - If it errors on gas / "not configured": check `CONTRACT_ADDRESS`,
     `RPC_URL`, `SIGNER_PRIVATE_KEY`, and that the signer wallet has test ETH.
4. As Agent, advance it (dispatched → in transit). As Customer, confirm receipt.
5. Each successful action is a real transaction on Sepolia — verify it on
   https://sepolia.etherscan.io by searching the contract address.

## Quick reference — where each value comes from

| Value | Source | Used by |
|---|---|---|
| Sepolia RPC URL | Alchemy/Infura (A1) | `blockchain/.env` + backend `RPC_URL` |
| Deployer private key | generated (A2) | `blockchain/.env` + backend `SIGNER_PRIVATE_KEY` |
| Contract address | `deploy:sepolia` output (A5) | backend `CONTRACT_ADDRESS` |
| DB credentials | managed Postgres (B) | backend `DB_*` |
| Backend URL + `/api` | backend host (C) | frontend `NEXT_PUBLIC_API_URL` |
