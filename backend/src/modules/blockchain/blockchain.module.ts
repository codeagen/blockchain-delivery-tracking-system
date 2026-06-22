import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

/**
 * BlockchainModule groups the single chain-integration service and exports it
 * so feature modules (e.g. DeliveryModule) can depend on it. Keeping all chain
 * access behind this module enforces the "backend is the only chain client" rule.
 */
@Module({
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
