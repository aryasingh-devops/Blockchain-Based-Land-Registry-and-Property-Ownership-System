const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry", function () {
  let registry;
  let admin, registrar, notary, ownerA, buyerB, unauthorized;
  const pid1 = ethers.keccak256(ethers.toUtf8Bytes("PROP-TEST-001"));
  const pid2 = ethers.keccak256(ethers.toUtf8Bytes("PROP-TEST-002"));

  beforeEach(async function () {
    [admin, registrar, notary, ownerA, buyerB, unauthorized] = await ethers.getSigners();
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    registry = await LandRegistry.deploy();
    await registry.waitForDeployment();

    await registry.setRegistrar(registrar.address, true);
    await registry.setNotary(notary.address, true);
  });

  describe("Deployment", function () {
    it("should set deployer as admin", async function () {
      expect(await registry.admin()).to.equal(admin.address);
    });

    it("should set registrar and notary roles", async function () {
      expect(await registry.isRegistrar(registrar.address)).to.be.true;
      expect(await registry.isNotary(notary.address)).to.be.true;
    });
  });

  describe("Property Registration", function () {
    it("should register a property successfully", async function () {
      await registry.connect(registrar).registerProperty(
        pid1, "PLOT-001", "Sector 12, Noida", 2500,
        "Residential", ownerA.address, "0xabc123"
      );
      const prop = await registry.getProperty(pid1);
      expect(prop.currentOwner).to.equal(ownerA.address);
      expect(prop.propertyNumber).to.equal("PLOT-001");
      expect(prop.status).to.equal(1); // Registered
    });

    it("should reject duplicate property ID", async function () {
      await registry.connect(registrar).registerProperty(
        pid1, "PLOT-001", "Noida", 2500, "Residential", ownerA.address, "0xabc"
      );
      await expect(
        registry.connect(registrar).registerProperty(
          pid1, "PLOT-001-DUP", "Noida", 2500, "Residential", ownerA.address, "0xabc"
        )
      ).to.be.revertedWith("Property already exists");
    });

    it("should reject zero owner address", async function () {
      await expect(
        registry.connect(registrar).registerProperty(
          pid1, "PLOT-001", "Noida", 2500, "Residential", ethers.ZeroAddress, "0xabc"
        )
      ).to.be.revertedWith("Owner cannot be zero address");
    });

    it("should reject zero area", async function () {
      await expect(
        registry.connect(registrar).registerProperty(
          pid1, "PLOT-001", "Noida", 0, "Residential", ownerA.address, "0xabc"
        )
      ).to.be.revertedWith("Area must be greater than zero");
    });

    it("should reject empty document hash", async function () {
      await expect(
        registry.connect(registrar).registerProperty(
          pid1, "PLOT-001", "Noida", 2500, "Residential", ownerA.address, ""
        )
      ).to.be.revertedWith("Document hash required");
    });

    it("should reject unauthorized registration", async function () {
      await expect(
        registry.connect(unauthorized).registerProperty(
          pid1, "PLOT-001", "Noida", 2500, "Residential", ownerA.address, "0xabc"
        )
      ).to.be.revertedWith("Only registrar");
    });

    it("should emit PropertyRegistered event", async function () {
      await expect(
        registry.connect(registrar).registerProperty(
          pid1, "PLOT-001", "Noida", 2500, "Residential", ownerA.address, "0xabc"
        )
      ).to.emit(registry, "PropertyRegistered");
    });
  });

  describe("Property Verification", function () {
    beforeEach(async function () {
      await registry.connect(registrar).registerProperty(
        pid1, "PLOT-001", "Noida", 2500, "Residential", ownerA.address, "0xabc"
      );
    });

    it("should verify a property", async function () {
      await registry.connect(notary).verifyProperty(pid1);
      const prop = await registry.getProperty(pid1);
      expect(prop.verified).to.be.true;
      expect(prop.status).to.equal(2); // Verified
    });

    it("should reject verification of non-existent property", async function () {
      const fakePid = ethers.keccak256(ethers.toUtf8Bytes("FAKE"));
      await expect(
        registry.connect(notary).verifyProperty(fakePid)
      ).to.be.revertedWith("Property does not exist");
    });

    it("should reject double verification", async function () {
      await registry.connect(notary).verifyProperty(pid1);
      await expect(
        registry.connect(notary).verifyProperty(pid1)
      ).to.be.revertedWith("Already verified");
    });

    it("should reject unauthorized verification", async function () {
      await expect(
        registry.connect(unauthorized).verifyProperty(pid1)
      ).to.be.revertedWith("Only notary");
    });

    it("should emit PropertyVerified event", async function () {
      await expect(
        registry.connect(notary).verifyProperty(pid1)
      ).to.emit(registry, "PropertyVerified");
    });
  });

  describe("Ownership Transfer", function () {
    beforeEach(async function () {
      await registry.connect(registrar).registerProperty(
        pid1, "PLOT-001", "Noida", 2500, "Residential", ownerA.address, "0xabc"
      );
      await registry.connect(notary).verifyProperty(pid1);
    });

    it("should transfer ownership successfully", async function () {
      await registry.connect(ownerA).transferOwnership(pid1, buyerB.address);
      const prop = await registry.getProperty(pid1);
      expect(prop.currentOwner).to.equal(buyerB.address);
      expect(prop.previousOwner).to.equal(ownerA.address);
    });

    it("should reject transfer by non-owner", async function () {
      await expect(
        registry.connect(buyerB).transferOwnership(pid1, buyerB.address)
      ).to.be.revertedWith("Only current owner can transfer");
    });

    it("should reject transfer of unverified property", async function () {
      await registry.connect(registrar).registerProperty(
        pid2, "PLOT-002", "Bangalore", 1800, "Commercial", ownerA.address, "0xdef"
      );
      await expect(
        registry.connect(ownerA).transferOwnership(pid2, buyerB.address)
      ).to.be.revertedWith("Property must be verified first");
    });

    it("should reject zero new owner address", async function () {
      await expect(
        registry.connect(ownerA).transferOwnership(pid1, ethers.ZeroAddress)
      ).to.be.revertedWith("New owner cannot be zero address");
    });

    it("should reject transfer of non-existent property", async function () {
      const fakePid = ethers.keccak256(ethers.toUtf8Bytes("FAKE"));
      await expect(
        registry.connect(ownerA).transferOwnership(fakePid, buyerB.address)
      ).to.be.revertedWith("Property does not exist");
    });

    it("should prevent old owner from transferring again", async function () {
      await registry.connect(ownerA).transferOwnership(pid1, buyerB.address);
      await expect(
        registry.connect(ownerA).transferOwnership(pid1, buyerB.address)
      ).to.be.revertedWith("Only current owner can transfer");
    });

    it("should emit OwnershipTransferred event", async function () {
      await expect(
        registry.connect(ownerA).transferOwnership(pid1, buyerB.address)
      ).to.emit(registry, "OwnershipTransferred");
    });
  });

  describe("Ownership History", function () {
    it("should track ownership transfers in history", async function () {
      await registry.connect(registrar).registerProperty(
        pid1, "PLOT-001", "Noida", 2500, "Residential", ownerA.address, "0xabc"
      );
      await registry.connect(notary).verifyProperty(pid1);
      await registry.connect(ownerA).transferOwnership(pid1, buyerB.address);

      const history = await registry.getOwnershipHistory(pid1);
      expect(history.length).to.equal(1);
      expect(history[0].from).to.equal(ownerA.address);
      expect(history[0].to).to.equal(buyerB.address);
    });
  });

  describe("View Functions", function () {
    it("should list properties by owner", async function () {
      await registry.connect(registrar).registerProperty(
        pid1, "PLOT-001", "Noida", 2500, "Residential", ownerA.address, "0xabc"
      );
      await registry.connect(registrar).registerProperty(
        pid2, "PLOT-002", "Bangalore", 1800, "Commercial", ownerA.address, "0xdef"
      );

      const props = await registry.getPropertiesByOwner(ownerA.address);
      expect(props.length).to.equal(2);
    });

    it("should return all property IDs", async function () {
      await registry.connect(registrar).registerProperty(
        pid1, "PLOT-001", "Noida", 2500, "Residential", ownerA.address, "0xabc"
      );
      const ids = await registry.getAllPropertyIds();
      expect(ids.length).to.equal(1);
    });
  });

  describe("Role Management", function () {
    it("should allow admin to grant/revoke roles", async function () {
      await registry.setNotary(buyerB.address, true);
      expect(await registry.isNotary(buyerB.address)).to.be.true;

      await registry.setNotary(buyerB.address, false);
      expect(await registry.isNotary(buyerB.address)).to.be.false;
    });

    it("should reject non-admin role changes", async function () {
      await expect(
        registry.connect(unauthorized).setNotary(buyerB.address, true)
      ).to.be.revertedWith("Only admin");
    });
  });
});
