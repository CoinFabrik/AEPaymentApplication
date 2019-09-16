import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientService } from './client/client.service';
import { CClient } from './client/client.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { getEnv } from './tools';
import { CustomerController, MerchantController } from './client/client.controller';
import { ProductsController } from './products/products.controller';
import { MerchantCustomerAccepted } from './client/mca.entity';
import { CloseModule } from './close/close.module';
import { ProfitModule } from './profits/profit.module';

let Entities = [CClient, MerchantCustomerAccepted];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: getEnv('DB', 'db.sqlite'),
      entities: [join(__dirname, '**/**.entity{.ts,.js}')],
      synchronize: true,
    }),
    CloseModule,
    ProfitModule,
  ],
  controllers: [AppController, MerchantController, CustomerController, ProductsController],
  providers: [AppService, ClientService],
})
export class AppModule {
}
