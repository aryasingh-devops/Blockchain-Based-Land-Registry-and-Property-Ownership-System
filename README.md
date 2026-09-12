# Blockchain-Based Land Registry & Property Ownership System

**Educational blockchain prototype** for tamper-evident property registration, verification, ownership transfer, and auditable on-chain ownership history — built with Solidity, Hardhat, Ethers.js, and React.

> ⚠️ **Educational Disclaimer**: This project uses **dummy/synthetic data only**. It is a learning prototype and does **NOT** create legally valid property ownership, nor does it connect to real government land records. A production system requires government authority, legal identity, cadastral databases, courts, and compliance with property law.

---

## 📚 Overview

Traditional land records are paper-based, fragmented across offices, forgeable, and slow to reconcile. Blockchain gives an immutable audit trail, eliminates duplicate registrations, removes double-sale risk, and enables instant, transparent verification.

This system simulates:

- Property registration (Registrar)
- Property verification (Notary)
- Ownership transfer (Owner, with validations)
- Ownership history / audit trail (events + on-chain records)
- Document tamper-evidence via SHA-256 hashes
- Role-based access control (Admin / Registrar / Surveyor / Notary / Owner)

## 🎯 Objectives

- Build a **beginner-friendly but industry-relevant** blockchain land registry.
- Store property records with an **immutable ownership trail**.
- Enforce **role-based access** and validate state transitions in smart contracts.
- Demonstrate **document hash verification** (garbage-in-garbage-out / tamper-evidence).
- Provide **working Hardhat tests**, a **Remix walkthrough**, and an optional **React dApp**.

## 🧩 Blockchain Concepts Used

| Concept | Usage here |
|---|---|
| Blockchain / Ethereum | Immutable public ledger for records + hashes |
| Smart Contract | `LandRegistry.sol` enforces rules on-chain |
| Solidity | Contract language |
| Wallet Address | Identity of owners / authority |
| `msg.sender` | Identifies the caller (owner/role) |
| `struct` | `Property`, `OwnershipRecord` |
| `mapping` | `properties`, `propertyExists`, `ownershipHistory`, role flags |
| `array` | `allPropertyIds`, `ownershipHistory[]` |
| `enum` | `PropertyStatus` (Registered/Verified/Transferred/Disputed) |
| `modifier` | `onlyAdmin`, `onlyRegistrar`, `onlyNotary` |
| `event` | `PropertyRegistered`, `PropertyVerified`, `OwnershipTransferred`, `PropertyStatusUpdated` |
| `require()` | Guard every rule (roles, zero addresses, duplicates, valid states) |
| Access control | Admin grants Registrar/Surveyor/Notary roles |
| Document hash | SHA-256 hash stored on-chain; documents stay off-chain |
| Transaction hash | Proof of each on-chain action |
| Immutability / audit trail | Events + `ownershipHistory[]` preserve every change |
| Testnet | Sepolia + local Hardhat node (no real crypto needed) |
| Gas | Every state change costs gas (free on Remix VM / local node) |

## 👥 Actors & Roles

| Role | Permissions |
|---|---|
| **Admin** (deployer) | Grants/revokes roles, updates property status |
| **Registrar** | Registers new properties |
| **Surveyor** | (role exists) validates geo/survey data — reserved for advanced flow |
| **Notary** | Verifies properties (approves authenticity) |
| **Owner** | Transfers *their own* verified property |
| **Buyer / Citizen** | Receives ownership, verifies records (read-only) |

## 🏗 Architecture

```
┌───────────────────────────────┐
│ FRONTEND (React + ethers.js)  │
│  Authority / Owner / Buyer    │
└───────────────┬───────────────┘
                │ MetaMask / BrowserProvider
┌───────────────▼───────────────┐
│  LandRegistry Smart Contract  │  (Solidity 0.8.20)
│  - Property registry          │
│  - Role access control        │
│  - Registration + verification│
│  - Ownership transfer         │
│  - Ownership history + events │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│ OFF-CHAIN (documents only)    │
│  sample_documents/*.json      │
│  SHA-256 hashes stored on-chain│
└───────────────────────────────┘
```

**Registration flow:** Authority → `registerProperty()` → record stored → `PropertyRegistered` event → status = Registered.

**Verification flow:** Notary → `verifyProperty()` → status = Verified → `PropertyVerified` event.

**Transfer flow:** Current owner → `transferOwnership()` → validations (owner, verified, not disputed, non-zero address) → new owner set → `OwnershipTransferred` event + history push → status = Transferred.

## 📊 Property Data Model

```solidity
struct Property {
    bytes32 propertyId;      // unique key, e.g. keccak256("PROP-001")
    string  propertyNumber;  // survey/plot number
    string  location;        // address / geo reference
    uint256 area;            // area in sq ft
    string  propertyType;    // Residential / Commercial / Land
    address currentOwner;    // wallet that owns it now
    address previousOwner;   // prior owner (address(0) on registration)
    string  documentHash;    // SHA-256 of off-chain document
    bool    verified;        // notary-verified flag
    PropertyStatus status;   // Registered/Verified/Transferred/Disputed
    uint256 registeredAt;    // block timestamp
    uint256 lastTransferredAt;
}
```

Status enum: `None(0), Registered(1), Verified(2), TransferPending(3), Transferred(4), Disputed(5)`

## ⚙️ Smart Contract Functions

| Function | Who | Purpose |
|---|---|---|
| `registerProperty(...)` | Registrar | Create property, bind initial owner, store document hash |
| `verifyProperty(id)` | Notary | Mark property verified |
| `transferOwnership(id, newOwner)` | Current owner | Move ownership + record history |
| `updatePropertyStatus(id, status)` | Admin | Change status (e.g. Disputed) |
| `getProperty(id)` | anyone | Read full property record |
| `getOwnershipHistory(id)` | anyone | Full transfer history |
| `getPropertiesByOwner(addr)` | anyone | List a wallet's properties |
| `getAllPropertyIds()` | anyone | Enumerate all properties |
| `setRegistrar / setSurveyor / setNotary` | Admin | Role management |

**Security controls:** duplicate-ID guard, zero-address guards, role checks, verification requirement before transfer, disputed-property transfer block, old-owner re-transfer block (only current owner can transfer).

## 🔒 Security & Real-World Limitations

- **Garbage in, garbage out** — blockchain preserves *whatever was entered*. If the initial data is wrong/fraudulent, the ledger faithfully records wrong data. Blockchain cannot prove a document is authentic; it only proves a hash was fixed at a time.
- **Wallet identity ≠ legal identity** — a wallet holding title does not mean the person is legally entitled.
- **Compromised private keys** — anyone with the key can act as the owner. Real systems need identity + hardware keys + recovery.
- **Fraudulent authority** — role keys in one place are a single point of trust.
- **Off-chain data forgery** — document content is only as good as the verification process that hashed it.
- **Immutability** — errors can't be silently corrected (good for audit, hard for mistaken records).
- Legal realities: inheritance, court orders, mortgages/liens, disputes, and government integration all need off-chain legal processes.

## 📁 Folder Structure

```
Blockchain-Land-Registry-Property-Ownership/
├── contracts/LandRegistry.sol     # Main smart contract
├── scripts/
│   ├── deploy.js                  # Deploys + registers a sample property
│   ├── simulate.js                # Full actor simulation (A→B transfer)
│   └── hashDocuments.js           # Demonstrates document tamper-evidence
├── test/LandRegistry.test.js      # Hardhat test suite (role/gating/history)
├── frontend/
│   ├── src/App.jsx                # React dApp (3 dashboards)
│   └── src/LandRegistryABI.js     # ABI + address
├── sample_documents/              # Dummy property documents (JSON)
├── docs/                          # Project report / interview prep
├── screenshots/                   # Proof images
├── .github/workflows/ci.yml       # GitHub Actions CI
├── hardhat.config.js
├── package.json
└── README.md
```

## 🚀 Installation

Requirements: **Node.js 18+** and any browser.

```bash
# 1) install deps
npm install

# 2) compile the contract
npm run compile

# 3) run tests
npm run test

# 4) ⚡ QUICK DEMO — everything in one command:
npm run demo
#    starts a local node, seeds 4 sample properties, opens the dApp at http://localhost:3000

# or, step by step:
# 5) start a local blockchain node (in a second terminal)
npm run node

# 6) deploy + register a sample property
npm run deploy          # requires the node from step 5 running

# 7) seed 4 sample properties (great for the frontend demo)
npm run seed

# 8) full actor simulation (A→B transfer)
npm run simulate:local  # in-process, no node needed
```

> ⚠️ The project folder name contains `&`, which breaks `cmd.exe` path resolution, so commands are wired to invoke Node directly (`node node_modules/hardhat/internal/cli/bootstrap.js ...`). On a normally-named repo you can use `npx hardhat` / `npx hardhat test` equivalently.

The Hardhat node prints 20 test accounts. The default `LandRegistry` address is `0x5FbDB2315678afecb367f032d93F642f64180aa3` (the first contract a fresh local node deploys). If yours differs, the dApp lets you edit and save the address in the app.

## 🎛 Optional Frontend (React dApp)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

The dApp **auto-connects to the local node in read-only mode**, so with `npm run node` + `npm run seed` running you can immediately search `PROP-1001` … `PROP-1004` and see full property details + ownership history — no MetaMask needed.

To submit transactions:
1. Run `npm run node`, then `npm run seed` (or just `npm run demo`).
2. Open MetaMask → add network **http://localhost:8545** (chainId 31337).
3. Import a Hardhat test-account private key (Account 0 = admin/registrar/notary; `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`).
4. "Connect Wallet" in the app.

> Note: property IDs are `keccak256("PROP-1001")` on-chain. The dApp hashes IDs the same way, so seeded data, script outputs, and the app all stay in sync. You may also paste a raw `0x…` 32-byte hash into any search box.

- **Authority Dashboard** (account 0 = admin/registrar/notary): register + verify + search.
- **Owner Dashboard**: transfer ownership, list my properties.
- **Buyer / Verify**: search any property, view details + history.

## ▶ Remix Simulation (no install)

1. Open https://remix.ethereum.org → create `contracts/LandRegistry.sol`.
2. Paste the contract from `contracts/LandRegistry.sol`.
3. Compile (Solidity 0.8.20) → Deploy (Remix VM, account 0 as admin). The deployer is automatically Admin + Registrar + Notary.
4. Accounts 1–3 are Owner/Buyer/Unauthorized (deployer already has registrar/notary roles, so no extra setup needed).
5. Example calls:
   - `registerProperty("0x...PROP-001-hash", "PLOT-001", "Noida", 2500, "Residential", <account2>, "0xabc...")`
   - `verifyProperty(_propertyId)`
   - `transferOwnership(_propertyId, <account3>)`
   - `getProperty(_propertyId)`, `getOwnershipHistory(_propertyId)`

See `docs/REMIX_SIMULATION.md` for a step-by-step account-by-account walkthrough and screenshot checklist.

## 📦 Document Hash Verification

```bash
node scripts/hashDocuments.js
```

Expected output shows two different SHA-256 hashes for the original and a tampered document — proving any modification changes the hash (tamper-evidence).

## 🧪 Testing Strategy

26 tests covering: deployment, roles, registration (duplicate/zero-address/area/hash), verification (unauthorized/double verify), transfer (non-owner, unverified, zero-address, disputed, stale owner), history, listing, and role management.

## 📝 Notes for GitHub

- Add topics: `blockchain`, `solidity`, `land-registry`, `real-estate`, `property`, `ethereum`, `smart-contract`, `web3`, `proptech`, `hardhat`, `ethersjs`, `dapp`.
- Suggested commits: see `docs/GIT_STRATEGY.md`.

## 🔗 License

MIT — educational use only. No warranty; does **not** constitute legal advice or valid ownership.