const hre = require("hardhat");

async function main() {
  const [deployer, ownerA, ownerB] = await hre.ethers.getSigners();

  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy();
  await registry.waitForDeployment();
  const address = await registry.getAddress();
  console.log("LandRegistry:", address);

  const seed = [
    ["PROP-1001", "PLOT-1001", "Connaught Place, New Delhi", 1450, "Residential", ownerA.address, "0x1aca...71aa"],
    ["PROP-1002", "PLOT-1002", "MG Road, Bangalore", 2200, "Commercial", ownerA.address, "0x2bcb...8bbd"],
    ["PROP-1003", "PLOT-1003", "Marine Drive, Mumbai", 3100, "Residential", ownerB.address, "0x3cdc...99ce"],
    ["PROP-1004", "PLOT-1004", "Park Street, Kolkata", 950, "Commercial", ownerB.address, "0x4ded...aabf"],
  ];

  for (const [pid, num, loc, area, type, owner, h] of seed) {
    const key = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(pid));
    await (await registry.registerProperty(key, num, loc, area, type, owner, h)).wait();
    await (await registry.verifyProperty(key)).wait();
    console.log(`Seeded ${pid} -> owner ${owner.slice(0, 8)}... verified`);
  }

  console.log("\nSeed complete. Contract:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});