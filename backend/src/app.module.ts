import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import datasource, { initializeDataSource } from './database/datasource';

@Module({
  imports: [
    ConfigModule.forRoot({
       isGlobal: true ,
        envFilePath : ['.env.local',`env.${process.env.PROFILE}`,'.env'],
      }),
    TypeOrmModule.forRootAsync({
      useFactory: () => datasource.options,
      dataSourceFactory: () => initializeDataSource(),
    }),
    UsersModule,
    AuthModule,
    BlockchainModule,
    DeliveryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
