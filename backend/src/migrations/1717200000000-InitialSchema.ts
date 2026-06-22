import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema: the off-chain Postgres cache.
 *
 * Two tables, mirroring the entities:
 *  - users                    (auth records + custodial wallet)
 *  - blockchain_transactions  (tx-hash lookup cache, keyed by on-chain delivery id)
 *
 * The chain remains the system of record; these tables are an off-chain cache.
 */
export class InitialSchema1717200000000 implements MigrationInterface {
  name = 'InitialSchema1717200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // gen_random_uuid() is built into Postgres 13+; pgcrypto provides it on
    // older versions. IF NOT EXISTS keeps this safe either way.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ---- users ----
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('SELLER', 'AGENT', 'CUSTOMER', 'ADMIN')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "full_name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL,
        "ethereum_address" character varying NOT NULL,
        "private_key" character varying NOT NULL,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // ---- blockchain_transactions ----
    await queryRunner.query(
      `CREATE TYPE "public"."blockchain_transactions_action_enum" AS ENUM('CREATE', 'ASSIGN', 'STATUS', 'CONFIRM')`,
    );
    await queryRunner.query(`
      CREATE TABLE "blockchain_transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "delivery_id" integer NOT NULL,
        "tx_hash" character varying NOT NULL,
        "action" "public"."blockchain_transactions_action_enum" NOT NULL,
        CONSTRAINT "PK_blockchain_transactions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_blockchain_transactions_delivery_id" ON "blockchain_transactions" ("delivery_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_blockchain_transactions_delivery_id"`,
    );
    await queryRunner.query(`DROP TABLE "blockchain_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."blockchain_transactions_action_enum"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
