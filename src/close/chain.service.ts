import { Injectable } from '@nestjs/common';
import { CClient } from '../client/client.entity';
import { ServiceBase } from '../client/client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  async closeChannel(client: CClient) {
    const connectedClient = ServiceBase.getClientByAddress(client.address, 'customer');
    if (connectedClient) {
      return connectedClient.channel.solo();
    }
    throw new Error('Client not connected');
  }
}
