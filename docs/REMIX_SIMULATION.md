# Remix VM Simulation Walkthrough

Goal: prove the contract works without installing anything. Use **Remix IDE → Remix VM (Cancun/CancunVM)**.

## Accounts
| # | Index (default Remix VM) | Role |
|---|---|---|
| ACCOUNT 1 | account 0 | Authority / Admin (also Registrar + Notary by default) |
| ACCOUNT 2 | account 1 | Owner A |
| ACCOUNT 3 | account 2 | Buyer B |
| ACCOUNT 4 | account 3 | Unauthorized user |

## Step-by-step
1. Open <https://remix.ethereum.org>.
2. Create file `contracts/LandRegistry.sol`, paste the contract code from `contracts/LandRegistry.sol`.
3. On the **Solidity Compiler** tab set compiler to `0.8.20` → **Compile LandRegistry.sol**. Expected: green check, ABI generated. **Screenshot: successful compilation.**
4. Switch to **Deploy & Run Transactions** → Environment: **Remix VM (Cancun)** → **Deploy** with ACCOUNT 1 selected. Expected: transaction accepted, contract address printed in terminal. **Screenshot: deployment.**
5. With ACCOUNT 1 (authority), call `registerProperty` with dummy values:
   - `_propertyId`: any 32-byte value → use `0x` + 64 hex chars, e.g. `0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0001`
   - `_propertyNumber`: `"PLOT-001"`
   - `_location`: `"Sector 12, Noida"`
   - `_area`: `2500`
   - `_propertyType`: `"Residential"`
   - `_initialOwner`: ACCOUNT 2 address
   - `_documentHash`: `"0xabc123..."`
   Expected: `PropertyRegistered` event in terminal. **Screenshot: registration tx + event.**
6. Call `getProperty(_propertyId)` (ACCOUNT 1). Expected: struct with `currentOwner` = ACCOUNT 2, status `1` (Registered). **Screenshot: property details.**
7. Switch to ACCOUNT 4 (unauthorized): call `verifyProperty(_propertyId)`. Expected: revert `Only notary`. **Screenshot: rejection error.**
8. Switch to ACCOUNT 1: call `verifyProperty(_propertyId)`. Expected: `PropertyVerified` + `PropertyStatusUpdated` events, status → `2`. **Screenshot: verification.**
9. Switch to ACCOUNT 2 (Owner A): call `transferOwnership(_propertyId, <ACCOUNT 3>)`. Expected: `OwnershipTransferred` event, status → `4`. **Screenshot: transfer tx.**
10. Call `getProperty(_propertyId)`. Expected: `currentOwner` = ACCOUNT 3, `previousOwner` = ACCOUNT 2. **Screenshot: new owner output.**
11. Switch to ACCOUNT 2 (old owner): call `transferOwnership(_propertyId, <ACCOUNT 3>)` again. Expected: revert `Only current owner can transfer`. **Screenshot: rejection.**
12. Call `getOwnershipHistory(_propertyId)`. Expected: array with one record `from`=ACCOUNT2, `to`=ACCOUNT3. **Screenshot: ownership history.**

## Screenshots to capture
1. `01_compile.png` – successful compilation
2. `02_deploy.png` – deployment tx + address
3. `03_register.png` – registerProperty tx + event
4. `04_details.png` – getProperty output (Owner = ACCOUNT 2)
5. `05_unauth_verify_rejected.png` – unauthorized verify revert
6. `06_verify.png` – verifyProperty events
7. `07_transfer.png` – transferOwnership event
8. `08_new_owner.png` – getProperty output (Owner = ACCOUNT 3)
9. `09_old_owner_rejected.png` – stale owner revert
10. `10_history.png` – getOwnershipHistory output