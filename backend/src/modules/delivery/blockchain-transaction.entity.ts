import { Column, Entity, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../database/base.entity';

/** The lifecycle action that produced an on-chain transaction. */
export enum TxAction {
  CREATE = 'CREATE',
  ASSIGN = 'ASSIGN',
  STATUS = 'STATUS',
  CONFIRM = 'CONFIRM',
}

/**
 * Off-chain record of a blockchain transaction that affected a delivery.
 * This is an OFF-CHAIN CACHE for fast tx-hash lookup — the chain remains the
 * system of record. One row per transaction, keyed by the on-chain delivery id.
 */
@Entity('blockchain_transactions')
export class BlockchainTransaction extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'integer', name: 'delivery_id' })
  deliveryId!: number;

  @Column({ type: 'varchar', name: 'tx_hash' })
  txHash!: string;

  @Column({ type: 'enum', enum: TxAction })
  action!: TxAction;
}
