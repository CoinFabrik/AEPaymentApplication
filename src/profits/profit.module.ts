import { Module } from '@nestjs/common';
import { ProfitService } from './profit.service';
import { ProfitController } from './profit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CClient } from '../client/client.entity';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ChainService } from './chain.service';
import { ProfitTransactionEntity } from '../common/entities/profitTransactions.entity';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantCustomerAccepted, CClient, ProfitTransactionEntity, ClosedTransactionEntity])],
  controllers: [ProfitController],
  providers: [ProfitService, ChainService],
  exports: [],
})
export class ProfitModule {
}
