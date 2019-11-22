import { Module } from '@nestjs/common';
import { InfoService } from './info.service';
import { InfoController } from './info.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CClient } from '../client/client.entity';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ProfitTransactionEntity } from '../common/entities/profitTransactions.entity';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [ChainModule, TypeOrmModule.forFeature([MerchantCustomerAccepted, CClient, ProfitTransactionEntity, ClosedTransactionEntity])],
  controllers: [InfoController],
  providers: [InfoService],
  exports: [],
})
export class InfoModule {
}
