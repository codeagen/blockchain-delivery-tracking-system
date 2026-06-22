import { ethers } from "hardhat";

/**
 * Deploys the DeliveryManagement contract to the configured network
 * (local Hardhat network or Ganache) and logs the resulting address.
 *
 * The deploying account becomes the contract admin (the only account allowed
 * to assign agents). No public/mainnet network is targeted by design.
 */
async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DeliveryManagement with account:", deployer.address);

  // Deploy the contract and wait until it is mined.
  const factory = await ethers.getContractFactory("DeliveryManagement");
  const delivery = await factory.deploy();
  await delivery.waitForDeployment();

  const address = await delivery.getAddress();
  console.log("DeliveryManagement deployed to:", address);
  console.log("Contract admin (deployer):", deployer.address);
}

// Recommended Hardhat pattern for surfacing async errors with a non-zero exit.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
