import { Module } from '@nestjs/common';
import { CloseService } from './close.service';
import { CloseController } from './close.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CClient } from '../client/client.entity';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ClosedTransactionEntity } from './closedTransactions.entity';
import { ChainService } from './channel.service';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantCustomerAccepted, CClient, ClosedTransactionEntity])],
  controllers: [CloseController],
  providers: [CloseService, ChainService],
  exports: [],
})
export class CloseModule {
}
