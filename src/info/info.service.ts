import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ProfitTransactionEntity } from '../common/entities/profitTransactions.entity';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';
import { ChainService } from '../chain/chain.service';
import { CClient } from '../client/client.entity';

@Injectable()
export class InfoService {

  constructor(
    @InjectRepository(CClient)
    private readonly cClientRepository: Repository<CClient>,
    @InjectRepository(MerchantCustomerAccepted)
    private readonly merchantCustomerAcceptedRepo: Repository<MerchantCustomerAccepted>,
    @InjectRepository(ProfitTransactionEntity)
    private readonly profitTransactionRepo: Repository<ProfitTransactionEntity>,
    @InjectRepository(ClosedTransactionEntity)
    private readonly closedTransactionRepo: Repository<ClosedTransactionEntity>,
    private readonly chainService: ChainService,
  ) {
  }

  async getAllCustomers() {
    return await this.cClientRepository.find();
  }

  async findAll() {
    return await this.profitTransactionRepo.find({ relations: ['closeTx'] });

  }

  async findOne(id: number) {
    return await this.merchantCustomerAcceptedRepo.findOne(id);
  }

}
