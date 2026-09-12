const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const [authority, ownerA, buyerB, unauthorized] = signers;

  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy();
  await registry.waitForDeployment();
  const address = await registry.getAddress();
  console.log("LandRegistry at:", address);

  // --- Property 1: Owner A ---
  const pid1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PROP-001"));
  await (await registry.registerProperty(
    pid1, "PLOT-001", "Sector 12, Noida", 2500,
    "Residential", ownerA.address,
    "0xaaa111"
  )).wait();
  console.log("PROP-001 registered for Owner A");

  await (await registry.verifyProperty(pid1)).wait();
  console.log("PROP-001 verified");

  // --- Property 2: Owner A ---
  const pid2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PROP-002"));
  await (await registry.registerProperty(
    pid2, "PLOT-002", "MG Road, Bangalore", 1800,
    "Commercial", ownerA.address,
    "0xbbb222"
  )).wait();
  console.log("PROP-002 registered for Owner A");

  await (await registry.verifyProperty(pid2)).wait();
  console.log("PROP-002 verified");

  // --- Transfer PROP-001 to Buyer B ---
  await (await registry.connect(ownerA).transferOwnership(pid1, buyerB.address)).wait();
  console.log("PROP-001 transferred to Buyer B");

  // --- Show final state ---
  const p1 = await registry.getProperty(pid1);
  console.log("\nFinal PROP-001 owner:", p1.currentOwner);

  const history = await registry.getOwnershipHistory(pid1);
  console.log("Ownership history length:", history.length);

  const ownerAProps = await registry.getPropertiesByOwner(ownerA.address);
  console.log("Owner A properties:", ownerAProps.length);

  const buyerBProps = await registry.getPropertiesByOwner(buyerB.address);
  console.log("Buyer B properties:", buyerBProps.length);

  console.log("\nSimulation complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
