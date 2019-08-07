import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ClientService} from './client/client.service';
import {CClient, MerchantCustomerAccepted} from "./client/client.entity";
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import {getEnv} from "./tools";

let Entities = [CClient, MerchantCustomerAccepted];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: getEnv("DB", "db.sqlite"),
      entities: [join(__dirname, '**/**.entity{.ts,.js}')],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ClientService],
})
export class AppModule {}
