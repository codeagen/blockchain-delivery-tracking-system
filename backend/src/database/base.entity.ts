import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * AbstractBaseEntity provides the columns every persisted entity shares: a
 * UUID primary key and created/updated timestamps. Concrete entities extend it
 * so those fields are defined in exactly one place.
 */
export abstract class AbstractBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
