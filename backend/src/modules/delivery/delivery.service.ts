import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Delivery } from '../blockchain/delivery.interface';
import { DeliveryStatus } from '../blockchain/delivery-status.enum';
import { UsersService } from '../users/users.service';
import {
  BlockchainTransaction,
  TxAction,
} from './blockchain-transaction.entity';

/**
 * DeliveryService holds all delivery business logic. It delegates every state
 * change to the BlockchainService (the chain is the system of record) and
 * persists an OFF-CHAIN CACHE of transaction hashes per delivery id (in Postgres
 * via TypeORM) for fast lookup. The cache is never authoritative for delivery
 * state.
 */
@Injectable()
export class DeliveryService {
  constructor(
    private readonly blockchain: BlockchainService,
    private readonly users: UsersService,
    @InjectRepository(BlockchainTransaction)
    private readonly transactions: Repository<BlockchainTransaction>,
  ) {}

  /**
   * Resolve the custodial private key for an authenticated user id, so the
   * delivery is signed by that user's own wallet (matching the contract's
   * `msg.sender` role gates).
   */
  private async getSignerKey(userId: string): Promise<string> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Authenticated user not found.');
    }
    return user.privateKey;
  }

  /**
   * Create a delivery on-chain (signed by the seller) and cache the resulting
   * transaction hash. Returns the on-chain delivery plus the transaction hash.
   */
  async create(
    userId: string,
    customer: string,
    description: string,
  ): Promise<Delivery & { txHash: string }> {
    const { id, txHash } = await this.blockchain.createDelivery(
      await this.getSignerKey(userId),
      customer,
      description,
    );
    await this.cacheTxHash(id, txHash, TxAction.CREATE);
    const delivery = await this.blockchain.getDelivery(id);
    return { ...delivery, txHash };
  }

  /**
   * Assign an agent on-chain and cache the transaction hash.
   */
  async assignAgent(
    id: number,
    agent: string,
  ): Promise<Delivery & { txHash: string }> {
    const { txHash } = await this.blockchain.assignAgent(id, agent);
    await this.cacheTxHash(id, txHash, TxAction.ASSIGN);
    const delivery = await this.blockchain.getDelivery(id);
    return { ...delivery, txHash };
  }

  /**
   * Advance a delivery's status on-chain and cache the transaction hash.
   */
  async updateStatus(
    userId: string,
    id: number,
    status: DeliveryStatus,
  ): Promise<Delivery & { txHash: string }> {
    const { txHash } = await this.blockchain.updateStatus(
      await this.getSignerKey(userId),
      id,
      status,
    );
    await this.cacheTxHash(id, txHash, TxAction.STATUS);
    const delivery = await this.blockchain.getDelivery(id);
    return { ...delivery, txHash };
  }

  /**
   * Confirm receipt of a delivery on-chain (signed by the customer) and cache
   * the transaction hash.
   */
  async confirm(
    userId: string,
    id: number,
  ): Promise<Delivery & { txHash: string }> {
    const { txHash } = await this.blockchain.confirmDelivery(
      await this.getSignerKey(userId),
      id,
    );
    await this.cacheTxHash(id, txHash, TxAction.CONFIRM);
    const delivery = await this.blockchain.getDelivery(id);
    return { ...delivery, txHash };
  }

  /**
   * Read a single delivery from the chain, attaching its cached tx hashes
   * (in chronological order) from the off-chain store.
   */
  async findOne(id: number): Promise<Delivery & { txHashes: string[] }> {
    const delivery = await this.blockchain.getDelivery(id);
    const rows = await this.transactions.find({
      where: { deliveryId: id },
      order: { createdAt: 'ASC' },
    });
    return { ...delivery, txHashes: rows.map((row) => row.txHash) };
  }

  /**
   * List all deliveries from the chain (loops getDeliveryCount + getDelivery).
   */
  async findAll(): Promise<Delivery[]> {
    return this.blockchain.listDeliveries();
  }

  /**
   * Persist a transaction hash to the off-chain store for a delivery id.
   */
  private async cacheTxHash(
    deliveryId: number,
    txHash: string,
    action: TxAction,
  ): Promise<void> {
    const record = this.transactions.create({ deliveryId, txHash, action });
    await this.transactions.save(record);
  }
}
