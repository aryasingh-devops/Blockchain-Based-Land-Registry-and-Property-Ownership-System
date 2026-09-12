# Project Report — Blockchain-Based Land Registry & Property Ownership System

## Abstract
This project demonstrates an educational, tamper-evident land-records prototype built on Ethereum. Property parcels are represented as on-chain records with wallet-based ownership, role-based authority (Registrar/Notary), verification status, and a full audit trail of ownership transfers. All data is dummy/synthetic; the system does not create legally valid ownership.

## Introduction
Traditional land registries are paper-heavy, fragmented, manually reconciled, and vulnerable to forgery. Blockchain offers an immutable, transparent public ledger on which ownership records can be anchored so every transfer is traceable end-to-end.

## Problem Statement
- Duplicate and manipulated ownership records cause disputes and fraud (double sale).
- Verification is slow and manual.
- Records are fragmented across offices.
- No uniform, publicly auditable trail.

## Traditional Land Registry
A government office issues paper title deeds and mutates ownership records on transfer. Copies are kept in local registers; disputes require surveying archives and courts.

## Challenges
Forgery, loss of paper records, slow mutation, coordination between land/court/revenue offices, and identity issues.

## Proposed Blockchain System
- One smart contract = one registry.
- Property → one current owner.
- Changes must pass require() guards and emit events.
- Documents stored off-chain; only SHA-256 hashes on-chain.

## Objectives
Teach/prove: role-based registration, verification, secure transfer, hashing, history, testing, dApp frontend.

## Architecture
React frontend → MetaMask → LandRegistry contract → off-chain documents.

## Actors
Admin, Registrar, Surveyor, Notary, Owner, Buyer. See README role table.

## Property Data Model
`Property` struct + `OwnershipRecord` struct + mappings (README section).

## Smart Contract Design
Solidity 0.8.20. Modifiers: `onlyAdmin`, `onlyRegistrar`, `onlyNotary`. Events for every action. Guards prevent invalid states.

## Registration Workflow
Registrar calls `registerProperty` — validates unique ID, non-zero owner, positive area, non-empty hash → event → status Registered.

## Verification Workflow
Notary calls `verifyProperty` — property must exist, not already verified → event → status Verified.

## Ownership Transfer
Current owner calls `transferOwnership` — validates existence, non-zero new owner, caller is current owner, verified, not disputed → updates owner/previous, pushes history, emits event.

## Document Hashing
SHA-256 hash of `sample_documents/property_001.json` stored on-chain. Modify file → new hash → mismatch proves tampering (`scripts/hashDocuments.js`).

## Security
Duplicate IDs, zero addresses, role guards, verified-before-transfer, disputed-block, only-current-owner. Off-chain concerns: garbage-in/garbage-out, key compromise, legal identity.

## Implementation
Hardhat + ethers v6 + React/Vite. See installation section of README.

## Testing
36+ assertions in `test/LandRegistry.test.js` — all pass (see `npx hardhat test`).

## Simulation
Remix VM walkthrough in `docs/REMIX_SIMULATION.md`; local-node simulation in `scripts/simulate.js`.

## Results
Registration, verification, transfer, and history all behave as specified; unauthorized actions revert; tampered documents produce different hashes.

## Applications
Government registries, property portals, banks (lien due-diligence), title insurance, housing societies.

## Advantages
Transparency, tamper-evidence, speed, reduced duplicates, auditability.

## Limitations
No legal validity; depends on accuracy of initial input; identity ≠ wallet; needs government/court integration.

## Legal Considerations
Blockchain ≠ legal title. A real deployment requires registrar integration, identity verification, cadastral databases, courts, and applicable property law.

## Future Scope
IPFS document storage, encumbrance (lien) module, multi-signature approvals, ZK privacy proofs, permissioned/consortium chains, The Graph indexing.

## Conclusion
The prototype proves the core value proposition: an auditable, role-governed, tamper-evident ownership trail on Ethereum — while clearly scoping its educational limits.

---

*Author: Student Developer — Blockchain course project. Not legal advice.*