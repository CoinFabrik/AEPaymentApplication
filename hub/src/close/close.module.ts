import { Module } from '@nestjs/common';
import { CloseService } from './close.service';
import { CloseController } from './close.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CClient } from '../client/client.entity';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [ChainModule, TypeOrmModule.forFeature([MerchantCustomerAccepted, CClient, ClosedTransactionEntity])],
  controllers: [CloseController],
  providers: [CloseService],
  exports: [],
})
export class CloseModule {
}
