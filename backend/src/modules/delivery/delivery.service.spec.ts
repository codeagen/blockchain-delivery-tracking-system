import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveryService } from './delivery.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { UsersService } from '../users/users.service';
import { DeliveryStatus } from '../blockchain/delivery-status.enum';
import { Delivery } from '../blockchain/delivery.interface';
import { BlockchainTransaction } from './blockchain-transaction.entity';
import { Role } from '../../common/enums/role.enum';

/**
 * Unit tests for DeliveryService with a fully mocked BlockchainService and a
 * stub UsersService — no Ethereum node is required. Verifies the service
 * resolves the caller's custodial key, delegates to the chain, and caches
 * transaction hashes off-chain.
 */
describe('DeliveryService', () => {
  let service: DeliveryService;

  // The acting user's id and custodial signing key.
  const USER_ID = 'user-1';
  const SIGNER_KEY = '0xsellerprivatekey';

  // A sample on-chain delivery the mock returns from getDelivery.
  const sampleDelivery: Delivery = {
    id: 1,
    seller: '0x1111111111111111111111111111111111111111',
    customer: '0x2222222222222222222222222222222222222222',
    agent: '0x0000000000000000000000000000000000000000',
    description: 'Test parcel',
    status: DeliveryStatus.CREATED,
    createdAt: 1700000000,
    updatedAt: 1700000000,
  };

  // Mock BlockchainService injected in place of the real chain client.
  const blockchainMock = {
    createDelivery: jest.fn().mockResolvedValue({ id: 1, txHash: '0xabc' }),
    assignAgent: jest.fn().mockResolvedValue({ id: 1, txHash: '0xdef' }),
    updateStatus: jest.fn().mockResolvedValue({ id: 1, txHash: '0x123' }),
    confirmDelivery: jest.fn().mockResolvedValue({ id: 1, txHash: '0x456' }),
    getDelivery: jest.fn().mockResolvedValue(sampleDelivery),
    listDeliveries: jest.fn().mockResolvedValue([sampleDelivery]),
  };

  // Stub UsersService returning a user that owns the custodial signing key.
  const usersMock = {
    findById: jest.fn().mockResolvedValue({
      id: USER_ID,
      email: 'seller@example.com',
      passwordHash: 'hash',
      role: Role.SELLER,
      ethereumAddress: sampleDelivery.seller,
      privateKey: SIGNER_KEY,
    }),
  };

  // In-memory fake of Repository<BlockchainTransaction> for the off-chain cache.
  const buildTxRepoMock = () => {
    const rows: BlockchainTransaction[] = [];
    return {
      create: (data: Partial<BlockchainTransaction>): BlockchainTransaction => ({
        ...(data as BlockchainTransaction),
        createdAt: new Date(),
      }),
      save: (row: BlockchainTransaction): Promise<BlockchainTransaction> => {
        rows.push(row);
        return Promise.resolve(row);
      },
      find: ({
        where,
      }: {
        where: { deliveryId: number };
      }): Promise<BlockchainTransaction[]> =>
        Promise.resolve(rows.filter((r) => r.deliveryId === where.deliveryId)),
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: BlockchainService, useValue: blockchainMock },
        { provide: UsersService, useValue: usersMock },
        {
          provide: getRepositoryToken(BlockchainTransaction),
          useValue: buildTxRepoMock(),
        },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
  });

  it('creates a delivery signed by the caller and returns the tx hash', async () => {
    const result = await service.create(
      USER_ID,
      sampleDelivery.customer,
      'Test parcel',
    );
    expect(blockchainMock.createDelivery).toHaveBeenCalledWith(
      SIGNER_KEY,
      sampleDelivery.customer,
      'Test parcel',
    );
    expect(result.txHash).toBe('0xabc');
    expect(result.id).toBe(1);
  });

  it('caches tx hashes and exposes them via findOne', async () => {
    await service.create(USER_ID, sampleDelivery.customer, 'Test parcel');
    await service.assignAgent(1, sampleDelivery.seller);
    const found = await service.findOne(1);
    expect(found.txHashes).toEqual(['0xabc', '0xdef']);
  });

  it('delegates status updates to the chain, signed by the caller', async () => {
    await service.updateStatus(USER_ID, 1, DeliveryStatus.DISPATCHED);
    expect(blockchainMock.updateStatus).toHaveBeenCalledWith(
      SIGNER_KEY,
      1,
      DeliveryStatus.DISPATCHED,
    );
  });

  it('lists deliveries from the chain', async () => {
    const all = await service.findAll();
    expect(blockchainMock.listDeliveries).toHaveBeenCalled();
    expect(all).toHaveLength(1);
  });
});
