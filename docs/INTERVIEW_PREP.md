# Interview Preparation — 10 Questions & Answers

### Q1. Explain your project.
**A.** I built an educational blockchain land registry called "Blockchain-Based Land Registry & Property Ownership System". It's a Solidity smart contract deployed and tested with Hardhat, plus an optional React + ethers.js dApp. Property parcels are stored on-chain with a unique property ID, location, area, owner wallet address, verification status, and a SHA-256 document hash. A Registrar registers properties, a Notary verifies them, and only the current owner can transfer ownership. Every action emits an event and pushes to an ownership-history array, so the full ownership journey is auditable. Everything uses dummy data and test wallets — it's a proof-of-work prototype, not a legal system.

### Q2. Why blockchain for land records? (blockchain fundamentals)
**A.** Records are immutable, transparent, and shared across all nodes. Traditional paper registries can be forged, lost, or manipulated, and reconciliation is slow. On Ethereum every write is permanent and public, so a double-sale or a sneaky change to the owner is practically impossible to hide — anyone can re-check the chain.

### Q3. What is a smart contract and why is it a good fit here?
**A.** A smart contract is executable code deployed on-chain that runs with the same rules for everyone and cannot be changed once deployed. Land registry rules — "only a registrar can register", "only the owner can transfer", "you can't transfer a disputed property" — are encoded as `require()` checks, so the business logic can't be bypassed.

### Q4. What is `msg.sender` and how do modifiers help?
**A.** `msg.sender` is the address of the account calling the function. I use it for access control: e.g. in `transferOwnership` I check `properties[id].currentOwner == msg.sender`. Modifiers like `onlyAdmin` are reusable guards: `require(msg.sender == admin, "Only admin");` then `_;` runs the function body. They keep the code DRY and readable.

### Q5. Explain `struct` and `mapping` in your contract.
**A.** A `struct` groups related data into one type — I have `Property` with fields like `propertyId`, `location`, `area`, `currentOwner`, `verified`, `status`, and `OwnershipRecord` for `from`, `to`, `timestamp`. A `mapping` is a key-value store — `properties[bytes32] => Property` gives me O(1) lookup by property ID, and `propertyExists[id]` is a boolean guard against duplicates. `ownershipHistory[id]` is an array of records for the full audit trail.

### Q6. How did you make the system tamper-evident with document hashing?
**A.** Documents are kept off-chain because they're large and private. On-chain I store only the SHA-256 hash. `scripts/hashDocuments.js` hashes `sample_documents/property_001.json`, stores the hash, then modifies the file and re-hashes — the hashes differ, proving any tampering breaks the hash. In production if the recomputed file hash ≠ stored hash, the document has been altered.

### Q7. Walk me through an ownership transfer and its guards.
**A.** `transferOwnership(id, newOwner)` first checks the property exists, the new owner isn't the zero address, `msg.sender` is the current owner, the property is notary-verified, and its status isn't Disputed. Only then it sets `previousOwner = currentOwner`, `currentOwner = newOwner`, records the timestamp, pushes to `ownershipHistory`, and emits `OwnershipTransferred`. If the old owner tries to transfer again, the owner check reverts.

### Q8. Why not just store everything on-chain? (gas + privacy)
**A.** Gas costs scale with storage, and storing large identity/legal documents is wasteful and leaks personal data publicly. So I store only essential fields (IDs, owner, status, hash, timestamp) on-chain and keep the heavy documents off-chain. Events are cheaper than storage and are great for indexing history.

### Q9. What are the real-world limitations?
**A.** Biggest one is "garbage in, garbage out" — the chain preserves whatever was entered, so if a fraudulent authority registers a fake parcel, the chain faithfully records fake data. Also a wallet address isn't legal identity; a stolen private key lets the thief transfer as the "owner"; court orders, inheritance, and liens need legal processes; and the records only become legally meaningful through government/registrar integration.

### Q10. How did you test it and what would you add next?
**A.** I wrote ~36 Hardhat + Chai assertions covering roles, duplicate registration, zero-address guards, unauthorized access, verified-before-transfer, stale-owner rejection, history, and events — all green. Next steps: IPFS for documents, an encumbrance/lien module like a bank mortgage, multi-signature approval for transfers, MetaMask on a testnet, and a The Graph subgraph for querying history.