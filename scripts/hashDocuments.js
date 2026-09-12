const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function main() {
  const docsDir = path.join(__dirname, "..", "sample_documents");

  console.log("=== DOCUMENT HASH VERIFICATION DEMO ===\n");

  // Step 1: read original document
  const file1 = path.join(docsDir, "property_001.json");
  const hash1 = sha256File(file1);
  console.log("Step 1. Original document :", path.basename(file1));
  console.log("Step 2. SHA-256 hash      : 0x" + hash1);
  console.log();

  // Step 3: store the hash on-chain (demo value)
  console.log("Step 3. Stored on-chain as documentHash.");
  console.log();

  // Step 4: simulate a tampered document (change one word)
  let content = fs.readFileSync(file1, "utf8");
  const tampered = content.replace("Sector 12, Noida", "Sector 45, Gurgaon");
  const file2 = path.join(docsDir, "property_001_tampered.json");
  fs.writeFileSync(file2, tampered, "utf8");

  const hash2 = sha256File(file2);
  console.log("Step 4. Tampered document :", path.basename(file2));
  console.log("Step 5. New SHA-256 hash  : 0x" + hash2);
  console.log();

  // Step 6: compare
  const match = hash1 === hash2;
  console.log("Step 6. Hashes match      :", match ? "YES (NOT tampered)" : "NO (tampered ✓)");
  console.log();
  if (!match) {
    console.log("✓ Tamper-evident: any change to the document produces a different hash.");
    console.log("  A mismatch between the stored hash and the recomputed hash proves");
    console.log("  the document was modified.");
  }

  // hash a plain-text record too
  const record = ["PROP-001", "CA-12", "NA", "u4pruydqqvj"].join("|");
  console.log("\nText-hash demo: SHA256('" + record + "') = " + sha256Text(record));

  console.log("\n=== Done ===");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});