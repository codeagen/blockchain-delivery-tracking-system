import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { UsersModule } from '../users/users.module';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { BlockchainTransaction } from './blockchain-transaction.entity';

/**
 * DeliveryModule groups the delivery REST endpoints and their service, and
 * depends on BlockchainModule for chain interaction and UsersModule to resolve
 * each caller's custodial signing key.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([BlockchainTransaction]),
    BlockchainModule,
    UsersModule,
  ],
  providers: [DeliveryService],
  controllers: [DeliveryController],
})
export class DeliveryModule {}
