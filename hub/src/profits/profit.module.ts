import { Module } from '@nestjs/common';
import { ProfitService } from './profit.service';
import { ProfitController } from './profit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CClient } from '../client/client.entity';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ProfitTransactionEntity } from '../common/entities/profitTransactions.entity';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [ChainModule, TypeOrmModule.forFeature([MerchantCustomerAccepted, CClient, ProfitTransactionEntity, ClosedTransactionEntity])],
  controllers: [ProfitController],
  providers: [ProfitService],
  exports: [],
})
export class ProfitModule {
}
