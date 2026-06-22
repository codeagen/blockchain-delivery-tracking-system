import { Column, Entity, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../database/base.entity';
import { Role } from '../../common/enums/role.enum';

/**
 * Off-chain user record (persisted in Postgres). Users / auth are intentionally
 * stored off-chain — this is an off-chain cache, NOT authoritative delivery
 * state. Each user carries an Ethereum address mapping them to on-chain identity.
 */
@Entity('users')
export class User extends AbstractBaseEntity {
  @Column({ type: 'varchar', name: 'full_name' })
  fullName!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ type: 'varchar', name: 'ethereum_address' })
  ethereumAddress!: string;

  /**
   * Custodial wallet key used to sign the user's on-chain transactions so
   * `msg.sender` matches the contract's role gates. NEVER returned over the API.
   */
  @Column({ type: 'varchar', name: 'private_key' })
  privateKey!: string;
}

/** User shape safe to return over the API (no secrets). */
export type SafeUser = Omit<
  User,
  'passwordHash' | 'privateKey' | 'createdAt' | 'updatedAt'
>;
