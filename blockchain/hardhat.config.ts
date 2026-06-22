import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

/**
 * Hardhat configuration for the delivery management contracts.
 *
 * - Solidity ^0.8.20 with the optimizer enabled for cheaper deployments.
 * - `hardhat` is the in-process network used by the test suite.
 * - `localhost` targets an external local node (Hardhat node or Ganache) on
 *   the conventional 127.0.0.1:8545 endpoint.
 * - `sepolia` is the public Ethereum test network, used only when deploying
 *   the contract somewhere a hosted backend can reach it. Its RPC URL and a
 *   throwaway deployer key come from blockchain/.env (see .env.example).
 *   Mainnet is intentionally NOT configured.
 */

// Read the Sepolia deploy credentials from the environment (blockchain/.env).
// Both default to empty so the config still loads for local work; a deploy to
// sepolia will fail with a clear error if they are not set.
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? "";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // In-process network used by `hardhat test`.
    hardhat: {},
    // External local node (Hardhat node on :8545 or Ganache).
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Public Sepolia testnet. Deploy with: npm run deploy:sepolia
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
    },
  },
};

export default config;
