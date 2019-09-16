import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';
import { ChainService } from './chain.service';

@Injectable()
export class CloseService implements OnModuleDestroy {
  bgThread = null;
  bgProgress = { cancel: false, start: null, end: null, running: null, success: 0, error: 0, total: 0 };

  constructor(
    @InjectRepository(MerchantCustomerAccepted)
    private readonly merchantCustomerAcceptedRepo: Repository<MerchantCustomerAccepted>,
    @InjectRepository(ClosedTransactionEntity)
    private readonly closedTransactionRepo: Repository<ClosedTransactionEntity>,
    private readonly chainService: ChainService,
  ) {
  }

  onModuleDestroy(): any {
    console.log('ProfitService shutdown');
    this.shutdown();
  }

  shutdown() {
    this.bgProgress.cancel = true;
  }

  progress() {
    return Object.assign(this.bgProgress, { running: (this.bgThread != null) });
  }

  closeAll() {
    if (this.bgThread != null) {
      throw new Error('Operation in progress');
    }
    // TODO: Can be done better.
    this.bgProgress = { cancel: false, start: new Date(), end: null, running: null, success: 0, error: 0, total: 0 };
    this.bgThread = this.bgRunner()
      .then(res => {
        console.log('BG THREAD END');
        this.bgThread = null;
        this.bgProgress.cancel = false;
        this.bgProgress.end = new Date();
      })
      .catch(err => console.error('BG THREAD ERROR', err));
  }

  private async bgRunner() {
    console.log('BG RUNNER START');
    const clients = await this.chainService.getAllCustomers();
    for (const client of clients) {
      if (this.bgProgress.cancel) {
        return;
      }
      // store currentChannelId, just in case.
      const currentChannelId = client.channelId;
      let hash = 'CLIENT_NOT_CONNECTED';
      try {
        console.log('TRYING TO CLOSE CLIENT ID', client.id, currentChannelId);
        const res = await this.chainService.closeChannel(client);
        hash = res.result.hash;
      } catch (err) {
        console.error('CLOSING ERROR ', err);
      }
      console.log('CLOSED CLIENT ID ', client.id, currentChannelId, ' WITH TX ', hash);
      await this.doAccountingForChannel(currentChannelId, hash);
    }
    console.log('BG RUNNER END');
  }

  private async doAccountingForChannel(channelId: string, closeTxId: string) {
    // Can use an not exist query, but that will hide the fact that we closing twice the same purchase.
    const txs = await this.merchantCustomerAcceptedRepo.find({ channelId: channelId, action: 'purchase' });
    for (const tx of txs) {
      try {
        const e = new ClosedTransactionEntity(tx, closeTxId);
        await this.closedTransactionRepo.save(e);
        this.bgProgress.success++;
      } catch (err) {
        console.error('CLOSING ACCOUNTING ERROR ', err);
        this.bgProgress.error++;
      } finally {
        this.bgProgress.total++;
      }
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
