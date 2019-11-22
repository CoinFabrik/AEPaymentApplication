import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ProfitTransactionEntity } from '../common/entities/profitTransactions.entity';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';
import { CClient } from '../client/client.entity';
import { ServerChannel } from '../client/channel';
import { ServiceBase } from '../client/client.service';

@Injectable()
export class ChainService {

  constructor(@InjectRepository(CClient)
              private readonly cClientRepository: Repository<CClient>,
  ) {
  }

  async profit(client: MerchantCustomerAccepted) {
    let height = await ServerChannel.nodeuser.height();
    const hubPubKey = ServerChannel.pubkey;
    // TODO: BigNumber ?, what it returns?
    const ret = await ServerChannel.nodeuser.spend(client.amount, client.merchant);
    return ret.hash;
  }

  async getAllCustomers() {
    return await this.cClientRepository.find({ kind: 'customer' });
    //return ServiceBase.getClients('customer');
  }

  async closeChannel(client: CClient) {
    const connectedClient = ServiceBase.getClientByAddress(client.address, 'customer');
    if (connectedClient) {
      return connectedClient.channel.solo();
    }
    throw new Error('Client not connected');
  }
}
