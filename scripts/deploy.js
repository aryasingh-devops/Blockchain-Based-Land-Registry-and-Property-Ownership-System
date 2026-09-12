const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("LandRegistry deployed to:", address);

  // Register a sample property
  const propertyId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PROP-001"));
  const tx = await registry.registerProperty(
    propertyId,
    "PLOT-001",
    "Sector 12, Noida, UP, India",
    2500,
    "Residential",
    deployer.address,
    "0xabc123def45678900000000000000000000000000000000000000000000000"
  );
  await tx.wait();
  console.log("Sample property PROP-001 registered.");

  // Verify it
  const tx2 = await registry.verifyProperty(propertyId);
  await tx2.wait();
  console.log("Sample property PROP-001 verified.");

  console.log("\nDeployment complete!");
  console.log("Contract address:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
