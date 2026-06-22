import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Contract,
  ContractTransactionReceipt,
  JsonRpcProvider,
  Wallet,
  Result,
  parseEther,
} from 'ethers';
import abi from './abi/DeliveryManagement.json';
import { DeliveryStatus } from './delivery-status.enum';
import { ChainWriteResult, Delivery } from './delivery.interface';

/** Amount of ETH transferred to each new custodial wallet so it can pay gas. */
const WALLET_FUNDING_ETH = '1';

/**
 * BlockchainService is the ONLY place in the system that talks to the Ethereum
 * chain. It wraps ethers v6 against the DeliveryManagement contract.
 *
 * Signing model (custodial): each user has their own wallet, and state-changing
 * calls are signed with THAT user's key so the on-chain `msg.sender` matches the
 * contract's role gates (seller/agent/customer). The deployer key from the
 * environment acts as the contract admin (assignAgent) and funds new wallets.
 *
 * Initialised lazily so the app boots even before the contract is deployed
 * (CONTRACT_ADDRESS / SIGNER_PRIVATE_KEY blank → calls fail with a clear error).
 */
@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  /** Cached provider + admin (deployer) wallet, created on first use. */
  private provider: JsonRpcProvider | null = null;
  private adminWallet: Wallet | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * Lazily build (and cache) the provider and admin wallet from environment
   * config. Throws a clear 503 when chain configuration is incomplete.
   */
  private getAdminWallet(): Wallet {
    if (this.adminWallet) {
      return this.adminWallet;
    }

    const rpcUrl = this.config.get<string>('RPC_URL');
    const address = this.config.get<string>('CONTRACT_ADDRESS');
    const privateKey = this.config.get<string>('SIGNER_PRIVATE_KEY');

    if (!rpcUrl || !address || !privateKey) {
      this.logger.warn(
        'Blockchain not configured (RPC_URL / CONTRACT_ADDRESS / SIGNER_PRIVATE_KEY missing).',
      );
      throw new ServiceUnavailableException(
        'Blockchain is not configured. Set RPC_URL, CONTRACT_ADDRESS and SIGNER_PRIVATE_KEY in .env once the contract is deployed.',
      );
    }

    this.provider = new JsonRpcProvider(rpcUrl);
    this.adminWallet = new Wallet(privateKey, this.provider);
    this.logger.log(`Connected to DeliveryManagement at ${address}`);
    return this.adminWallet;
  }

  /** Contract instance bound to the admin/deployer wallet (reads + admin writes). */
  private getAdminContract(): Contract {
    const address = this.config.get<string>('CONTRACT_ADDRESS') as string;
    return new Contract(address, abi, this.getAdminWallet());
  }

  /** Contract instance bound to a specific user's custodial wallet. */
  private getUserContract(privateKey: string): Contract {
    // Ensure provider/admin are initialised (validates config) before signing.
    this.getAdminWallet();
    const address = this.config.get<string>('CONTRACT_ADDRESS') as string;
    const wallet = new Wallet(privateKey, this.provider as JsonRpcProvider);
    return new Contract(address, abi, wallet);
  }

  /**
   * Transfer a small amount of ETH from the admin/deployer wallet to a freshly
   * created custodial wallet so it can pay gas for its own transactions.
   */
  async fundWallet(address: string): Promise<void> {
    const admin = this.getAdminWallet();
    const tx = await admin.sendTransaction({
      to: address,
      value: parseEther(WALLET_FUNDING_ETH),
    });
    await tx.wait();
    this.logger.log(`Funded ${address} with ${WALLET_FUNDING_ETH} ETH`);
  }

  /**
   * Create a new delivery on-chain, signed by the seller's custodial wallet so
   * `msg.sender` (the recorded seller) is the user. Returns the new delivery id
   * and the transaction hash for off-chain caching.
   */
  async createDelivery(
    sellerKey: string,
    customer: string,
    description: string,
  ): Promise<ChainWriteResult> {
    const contract = this.getUserContract(sellerKey);
    const tx = await contract.createDelivery(customer, description);
    const receipt = await tx.wait();
    // Read the new id straight from the DeliveryCreated event so it is correct
    // even under concurrent creates (getDeliveryCount would race).
    const id = this.parseCreatedId(contract, receipt);
    return { id, txHash: tx.hash };
  }

  /**
   * Extract the new delivery id from the DeliveryCreated event in a transaction
   * receipt. Falls back to throwing if the event is missing (should not happen).
   */
  private parseCreatedId(
    contract: Contract,
    receipt: ContractTransactionReceipt | null,
  ): number {
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === 'DeliveryCreated') {
          return Number(parsed.args[0] as bigint);
        }
      } catch {
        // Log not from this contract / not decodable — skip it.
      }
    }
    throw new Error('DeliveryCreated event not found in transaction receipt.');
  }

  /**
   * Assign a delivery agent (admin only on-chain). Signed by the deployer wallet,
   * which is the contract admin.
   */
  async assignAgent(id: number, agent: string): Promise<ChainWriteResult> {
    const contract = this.getAdminContract();
    const tx = await contract.assignAgent(BigInt(id), agent);
    await tx.wait();
    return { id, txHash: tx.hash };
  }

  /**
   * Advance a delivery's status, signed by the assigned agent's custodial wallet.
   * Forward-only transitions are enforced by the contract.
   */
  async updateStatus(
    agentKey: string,
    id: number,
    newStatus: DeliveryStatus,
  ): Promise<ChainWriteResult> {
    const contract = this.getUserContract(agentKey);
    const tx = await contract.updateStatus(BigInt(id), newStatus);
    await tx.wait();
    return { id, txHash: tx.hash };
  }

  /**
   * Confirm receipt, signed by the assigned customer's custodial wallet.
   */
  async confirmDelivery(
    customerKey: string,
    id: number,
  ): Promise<ChainWriteResult> {
    const contract = this.getUserContract(customerKey);
    const tx = await contract.confirmDelivery(BigInt(id));
    await tx.wait();
    return { id, txHash: tx.hash };
  }

  /**
   * Read a single delivery from the chain and map the raw ethers `Result`
   * (array-like tuple) into a strongly typed Delivery object.
   */
  async getDelivery(id: number): Promise<Delivery> {
    const contract = this.getAdminContract();
    const raw = (await contract.getDelivery(BigInt(id))) as Result;
    return this.mapDelivery(raw);
  }

  /**
   * Read the total number of deliveries recorded on-chain.
   * The contract returns a uint256 which ethers v6 surfaces as a native bigint.
   */
  async getDeliveryCount(): Promise<number> {
    const contract = this.getAdminContract();
    const count = (await contract.getDeliveryCount()) as bigint;
    return Number(count);
  }

  /**
   * List every delivery. Ids are 1-based (1..count), matching the contract,
   * which reverts on id 0.
   */
  async listDeliveries(): Promise<Delivery[]> {
    const count = await this.getDeliveryCount();
    const deliveries: Delivery[] = [];
    for (let id = 1; id <= count; id++) {
      deliveries.push(await this.getDelivery(id));
    }
    return deliveries;
  }

  /**
   * Convert the array-like ethers tuple returned by getDelivery into a typed
   * Delivery. Fields are accessed by index to stay independent of ethers'
   * loosely-typed Result shape while avoiding `any`.
   */
  private mapDelivery(raw: Result): Delivery {
    return {
      id: Number(raw[0] as bigint),
      seller: String(raw[1]),
      customer: String(raw[2]),
      agent: String(raw[3]),
      description: String(raw[4]),
      status: Number(raw[5] as bigint) as DeliveryStatus,
      createdAt: Number(raw[6] as bigint),
      updatedAt: Number(raw[7] as bigint),
    };
  }
}
