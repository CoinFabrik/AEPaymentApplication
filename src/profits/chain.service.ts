import { Injectable } from '@nestjs/common';
import { CClient } from '../client/client.entity';
import { ServiceBase } from '../client/client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';
import { sleep } from '../tools';

/*
  A class to contain call to a service that must be implemented by other module and imported here in the future
 */
@Injectable()
export class ChainService {

  constructor(@InjectRepository(CClient)
              private readonly cClientRepository: Repository<CClient>,
  ) {
  }

  async getAllCustomers() {
    return await this.cClientRepository.find({ kind: 'customer' });
    //return ServiceBase.getClients('customer');
  }

  async profit(client: ClosedTransactionEntity) {
    await sleep(2000);
    console.log('DOING REGULAR BLOCKCHAIN TRANSACTION FOR PROFIT', client.id, 'PURCHASE', client.tx.id);
    return 'SOME TX HASH';
  }
}
