import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CClient } from '../client/client.entity';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ClosedTransactionEntity } from './closedTransactions.entity';
import { ChainService } from './channel.service';

@Injectable()
export class CloseService implements OnModuleDestroy {
  cancel: boolean = false;
  bgThread = null;

  constructor(
    @InjectRepository(MerchantCustomerAccepted)
    private readonly merchantCustomerAcceptedRepo: Repository<MerchantCustomerAccepted>,
    @InjectRepository(ClosedTransactionEntity)
    private readonly closedTransactionRepo: Repository<ClosedTransactionEntity>,
    private readonly chainService: ChainService,
  ) {
  }

  onModuleDestroy(): any {
    console.log('CloseService shutdown');
    this.shutdown();
  }

  shutdown() {
    this.cancel = true;
  }

  closeAll() {
    if (this.bgThread != null) {
      throw new Error('Operation in progress');
    }
    this.bgThread = this.bgRunner()
      .then(res => {
        console.log('BG THREAD END');
        this.bgThread = null;
        this.cancel = false;
      })
      .catch(err => console.error('BG THREAD ERROR', err));
  }

  private async bgRunner() {
    console.log('BG RUNNER START');
    const clients = await this.chainService.getAllCustomers();
    for (const client of clients) {
      if (this.cancel) {
        return;
      }
      // store currentChannelId, just in case.
      const currentChannelId = client.channelId;
      console.log('TRYING TO CLOSE CLIENT ID', client.id, currentChannelId);
      let hash = 'CLIENT_NOT_CONNECTED';
      try {
        const res = await this.chainService.closeChannel(client);
        hash = res.result.hash;
      } catch (err) {
        console.error('CLOSING ERROR ', err);
      }
      console.log('CLOSED CLIENT ID ', client.id, currentChannelId, ' WITH TX ', hash);
      this.doAccountingForChannel(currentChannelId, hash);
    }
    console.log('BG RUNNER END');
  }

  private async doAccountingForChannel(channelId: string, closeTxId: string) {
    const txs = await this.merchantCustomerAcceptedRepo.find({ channelId: channelId, action: 'purchase' });
    for (const tx of txs) {
      const e = new ClosedTransactionEntity(tx, closeTxId);
      this.closedTransactionRepo.save(e);
    }
  }

  async findAll(): Promise<ClosedTransactionEntity[]> {
    return await this.closedTransactionRepo.find({ relations: ['tx'] });
  }

  async findOne(id: number): Promise<ClosedTransactionEntity> {
    /*
    await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(1)
    .add(3);
     */
    return await this.closedTransactionRepo.findOne(id, { relations: ['tx'] });
  }

  async create(data: ClosedTransactionEntity) {
    await this.closedTransactionRepo.save(data);
  }

}
