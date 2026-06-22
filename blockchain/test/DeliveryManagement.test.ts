import { expect } from "chai";
import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { DeliveryManagement } from "../typechain-types";

/**
 * Numeric mirror of the on-chain `Status` enum, in lifecycle order. Used to
 * assert against the `status` field returned by getDelivery() and in event
 * argument checks.
 */
const Status = {
  CREATED: 0,
  ASSIGNED: 1,
  DISPATCHED: 2,
  IN_TRANSIT: 3,
  DELIVERED: 4,
} as const;

describe("DeliveryManagement", () => {
  let contract: DeliveryManagement;
  let admin: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let customer: HardhatEthersSigner;
  let agent: HardhatEthersSigner;
  let outsider: HardhatEthersSigner;

  const DESCRIPTION = "A box of textbooks";

  // Fresh contract before every test so state never leaks between cases.
  beforeEach(async () => {
    [admin, seller, customer, agent, outsider] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("DeliveryManagement");
    contract = await factory.deploy();
    await contract.waitForDeployment();
  });

  /** Helper: seller creates a delivery and returns its id (always 1 first). */
  async function createOne(): Promise<bigint> {
    await contract.connect(seller).createDelivery(customer.address, DESCRIPTION);
    return await contract.getDeliveryCount();
  }

  /** Helper: drive a delivery all the way to IN_TRANSIT. */
  async function driveToInTransit(id: bigint): Promise<void> {
    await contract.connect(admin).assignAgent(id, agent.address);
    await contract.connect(agent).updateStatus(id, Status.DISPATCHED);
    await contract.connect(agent).updateStatus(id, Status.IN_TRANSIT);
  }

  describe("Deployment", () => {
    it("sets the deployer as the admin", async () => {
      expect(await contract.admin()).to.equal(admin.address);
    });

    it("starts with a delivery count of zero", async () => {
      expect(await contract.getDeliveryCount()).to.equal(0n);
    });
  });

  describe("Full happy-path lifecycle", () => {
    it("walks CREATED -> ASSIGNED -> DISPATCHED -> IN_TRANSIT -> DELIVERED", async () => {
      const id = await createOne();
      expect((await contract.getDelivery(id)).status).to.equal(Status.CREATED);

      await contract.connect(admin).assignAgent(id, agent.address);
      expect((await contract.getDelivery(id)).status).to.equal(Status.ASSIGNED);

      await contract.connect(agent).updateStatus(id, Status.DISPATCHED);
      expect((await contract.getDelivery(id)).status).to.equal(Status.DISPATCHED);

      await contract.connect(agent).updateStatus(id, Status.IN_TRANSIT);
      expect((await contract.getDelivery(id)).status).to.equal(Status.IN_TRANSIT);

      await contract.connect(customer).confirmDelivery(id);
      expect((await contract.getDelivery(id)).status).to.equal(Status.DELIVERED);
    });

    it("auto-increments ids starting at 1", async () => {
      await contract.connect(seller).createDelivery(customer.address, "first");
      await contract.connect(seller).createDelivery(customer.address, "second");
      expect((await contract.getDelivery(1)).id).to.equal(1n);
      expect((await contract.getDelivery(2)).id).to.equal(2n);
      expect(await contract.getDeliveryCount()).to.equal(2n);
    });
  });

  describe("createDelivery", () => {
    it("records the caller as the seller and stores all fields", async () => {
      const id = await createOne();
      const d = await contract.getDelivery(id);
      expect(d.seller).to.equal(seller.address);
      expect(d.customer).to.equal(customer.address);
      expect(d.agent).to.equal(ethers.ZeroAddress);
      expect(d.description).to.equal(DESCRIPTION);
      expect(d.status).to.equal(Status.CREATED);
      expect(d.createdAt).to.be.greaterThan(0n);
      expect(d.updatedAt).to.equal(d.createdAt);
    });

    it("emits DeliveryCreated with id, seller and customer", async () => {
      await expect(
        contract.connect(seller).createDelivery(customer.address, DESCRIPTION),
      )
        .to.emit(contract, "DeliveryCreated")
        .withArgs(1n, seller.address, customer.address);
    });

    it("reverts when the customer is the zero address", async () => {
      await expect(
        contract.connect(seller).createDelivery(ethers.ZeroAddress, DESCRIPTION),
      ).to.be.revertedWith("Customer cannot be zero address");
    });

    it("reverts when seller and customer are the same account", async () => {
      await expect(
        contract.connect(seller).createDelivery(seller.address, DESCRIPTION),
      ).to.be.revertedWith("Seller and customer must differ");
    });
  });

  describe("assignAgent — access control & state", () => {
    it("lets the admin assign an agent and emits AgentAssigned", async () => {
      const id = await createOne();
      await expect(contract.connect(admin).assignAgent(id, agent.address))
        .to.emit(contract, "AgentAssigned")
        .withArgs(id, agent.address);
      const d = await contract.getDelivery(id);
      expect(d.agent).to.equal(agent.address);
      expect(d.status).to.equal(Status.ASSIGNED);
    });

    it("reverts when a non-admin tries to assign an agent", async () => {
      const id = await createOne();
      await expect(
        contract.connect(seller).assignAgent(id, agent.address),
      ).to.be.revertedWith("Only admin can assign agent");
    });

    it("reverts when assigning the zero address as agent", async () => {
      const id = await createOne();
      await expect(
        contract.connect(admin).assignAgent(id, ethers.ZeroAddress),
      ).to.be.revertedWith("Agent cannot be zero address");
    });

    it("reverts when the delivery is not in CREATED state", async () => {
      const id = await createOne();
      await contract.connect(admin).assignAgent(id, agent.address);
      // Second assignment attempt: status is now ASSIGNED.
      await expect(
        contract.connect(admin).assignAgent(id, outsider.address),
      ).to.be.revertedWith("Delivery not in CREATED state");
    });

    it("reverts for a non-existent delivery id", async () => {
      await expect(
        contract.connect(admin).assignAgent(99, agent.address),
      ).to.be.revertedWith("Delivery does not exist");
    });
  });

  describe("updateStatus — access control, transitions & events", () => {
    it("only the assigned agent may update status", async () => {
      const id = await createOne();
      await contract.connect(admin).assignAgent(id, agent.address);
      await expect(
        contract.connect(outsider).updateStatus(id, Status.DISPATCHED),
      ).to.be.revertedWith("Only assigned agent can update status");
    });

    it("emits StatusUpdated on each valid forward transition", async () => {
      const id = await createOne();
      await contract.connect(admin).assignAgent(id, agent.address);

      await expect(contract.connect(agent).updateStatus(id, Status.DISPATCHED))
        .to.emit(contract, "StatusUpdated")
        .withArgs(id, Status.DISPATCHED);

      await expect(contract.connect(agent).updateStatus(id, Status.IN_TRANSIT))
        .to.emit(contract, "StatusUpdated")
        .withArgs(id, Status.IN_TRANSIT);
    });

    it("reverts when skipping a state (ASSIGNED -> IN_TRANSIT)", async () => {
      const id = await createOne();
      await contract.connect(admin).assignAgent(id, agent.address);
      await expect(
        contract.connect(agent).updateStatus(id, Status.IN_TRANSIT),
      ).to.be.revertedWith("Invalid status transition");
    });

    it("reverts when reversing a state (DISPATCHED -> ASSIGNED)", async () => {
      const id = await createOne();
      await contract.connect(admin).assignAgent(id, agent.address);
      await contract.connect(agent).updateStatus(id, Status.DISPATCHED);
      await expect(
        contract.connect(agent).updateStatus(id, Status.ASSIGNED),
      ).to.be.revertedWith("Invalid status transition");
    });

    it("reverts when the agent tries to set DELIVERED (not their job)", async () => {
      const id = await createOne();
      await driveToInTransit(id);
      await expect(
        contract.connect(agent).updateStatus(id, Status.DELIVERED),
      ).to.be.revertedWith("Invalid status transition");
    });

    it("reverts when updating before an agent is assigned (CREATED)", async () => {
      const id = await createOne();
      // No agent assigned yet, so even the intended agent is not authorized.
      await expect(
        contract.connect(agent).updateStatus(id, Status.DISPATCHED),
      ).to.be.revertedWith("Only assigned agent can update status");
    });

    it("reverts for a non-existent delivery id", async () => {
      await expect(
        contract.connect(agent).updateStatus(99, Status.DISPATCHED),
      ).to.be.revertedWith("Delivery does not exist");
    });
  });

  describe("confirmDelivery — access control & state", () => {
    it("lets the assigned customer confirm and emits DeliveryConfirmed", async () => {
      const id = await createOne();
      await driveToInTransit(id);
      await expect(contract.connect(customer).confirmDelivery(id))
        .to.emit(contract, "DeliveryConfirmed")
        .withArgs(id);
      expect((await contract.getDelivery(id)).status).to.equal(Status.DELIVERED);
    });

    it("reverts when a non-customer tries to confirm", async () => {
      const id = await createOne();
      await driveToInTransit(id);
      await expect(
        contract.connect(outsider).confirmDelivery(id),
      ).to.be.revertedWith("Only assigned customer can confirm delivery");
    });

    it("reverts when the delivery is not IN_TRANSIT", async () => {
      const id = await createOne();
      await contract.connect(admin).assignAgent(id, agent.address);
      // Status is ASSIGNED, not IN_TRANSIT.
      await expect(
        contract.connect(customer).confirmDelivery(id),
      ).to.be.revertedWith("Delivery not in transit");
    });

    it("reverts for a non-existent delivery id", async () => {
      await expect(
        contract.connect(customer).confirmDelivery(99),
      ).to.be.revertedWith("Delivery does not exist");
    });
  });

  describe("No updates allowed after DELIVERED", () => {
    it("rejects agent status updates once delivered", async () => {
      const id = await createOne();
      await driveToInTransit(id);
      await contract.connect(customer).confirmDelivery(id);
      await expect(
        contract.connect(agent).updateStatus(id, Status.IN_TRANSIT),
      ).to.be.revertedWith("Invalid status transition");
    });

    it("rejects a second customer confirmation once delivered", async () => {
      const id = await createOne();
      await driveToInTransit(id);
      await contract.connect(customer).confirmDelivery(id);
      await expect(
        contract.connect(customer).confirmDelivery(id),
      ).to.be.revertedWith("Delivery not in transit");
    });
  });

  describe("getDelivery / getDeliveryCount", () => {
    it("returns the correct data for a delivery", async () => {
      const id = await createOne();
      await contract.connect(admin).assignAgent(id, agent.address);
      const d = await contract.getDelivery(id);
      expect(d.id).to.equal(id);
      expect(d.seller).to.equal(seller.address);
      expect(d.customer).to.equal(customer.address);
      expect(d.agent).to.equal(agent.address);
      expect(d.description).to.equal(DESCRIPTION);
      expect(d.status).to.equal(Status.ASSIGNED);
    });

    it("reverts for a non-existent delivery id", async () => {
      await expect(contract.getDelivery(99)).to.be.revertedWith(
        "Delivery does not exist",
      );
    });

    it("tracks the number of deliveries created", async () => {
      expect(await contract.getDeliveryCount()).to.equal(0n);
      await contract.connect(seller).createDelivery(customer.address, "one");
      await contract.connect(seller).createDelivery(customer.address, "two");
      expect(await contract.getDeliveryCount()).to.equal(2n);
    });
  });
});
