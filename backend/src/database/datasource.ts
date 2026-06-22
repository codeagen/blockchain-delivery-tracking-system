import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

/**
 * Single source of truth for the Postgres connection. Shared by the NestJS
 * runtime (TypeOrmModule.forRoot) and the TypeORM CLI (migrations).
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  // Hosted DATABASE_URL in production, split env variables for local.
  ...(process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'veridel',
        ssl,
      }),
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  migrationsTableName: 'migrations',
};

const datasource = new DataSource(dataSourceOptions);

/** Initialise the standalone DataSource (used by CLI/migration tooling). */
export async function initializeDataSource(): Promise<DataSource> {
  if (!datasource.isInitialized) {
    await datasource.initialize();
  }
  return datasource;
}

export default datasource;
