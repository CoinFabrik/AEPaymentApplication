import { HttpException, HttpStatus, Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantCustomerAccepted } from '../client/mca.entity';
import { ChainService } from './chain.service';
import { ProfitTransactionEntity } from '../common/entities/profitTransactions.entity';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';

@Injectable()
export class ProfitService implements OnModuleDestroy {
  bgThread = null;
  bgProgress = { cancel: false, start: null, end: null, running: null, success: 0, error: 0, total: 0 };

  constructor(
    @InjectRepository(MerchantCustomerAccepted)
    private readonly merchantCustomerAcceptedRepo: Repository<MerchantCustomerAccepted>,
    @InjectRepository(ProfitTransactionEntity)
    private readonly profitTransactionRepo: Repository<ProfitTransactionEntity>,
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

  shareAll() {
    if (this.bgThread != null) {
      throw new Error('Operation in progress');
    }
    this.bgProgress = { cancel: false, start: new Date(), end: null, running: null, success: 0, error: 0, total: 0 };
    this.bgThread = this.bgRunner()
      .then(res => {
        console.log('BG THREAD END');
        this.bgThread = null;
        this.bgProgress.end = new Date();
      })
      .catch(err => console.error('BG THREAD ERROR', err));
  }

  private async bgRunner() {
    console.log('BG RUNNER START');
    const result = await this.closedTransactionRepo
      .createQueryBuilder('closedTx')
      //.relation(MerchantCustomerAccepted, "tx")
      .innerJoinAndSelect('closedTx.tx', 'tx')
      .select()
      .where((qb) => {
        const subQuery = qb.subQuery()
          .select()
          .from(ProfitTransactionEntity, 'profit')
          .where(`closedTx.id = profit.closeTxId`)
          .getQuery();
        return 'NOT EXISTS ' + subQuery;
      });
    const closed = await result.getMany();
    for (const cl of closed) {
      if (this.bgProgress.cancel) {
        return;
      }
      // store currentChannelId, just in case.
      try {
        console.log('TRYING TO PROFIT PURCHASE', cl);
        const hash = await this.chainService.profit(cl);
        console.log('ACCOUNTING FOR PROFIT TX PURCHASE', hash, 'FOR', cl.id, 'PURCHASE ID', cl.tx.id);
        await this.doAccountingForProfit(cl, hash);
      } catch (err) {
        console.error('PROFIT TX ERROR', err);
      }
    }
    console.log('BG RUNNER END');
  }

  private async doAccountingForProfit(cl: ClosedTransactionEntity, shareTxId: string) {
    try {
      const e = new ProfitTransactionEntity(cl, shareTxId);
      await this.profitTransactionRepo.save(e);
      this.bgProgress.success++;
    } catch (err) {
      console.error('Error profit transaction', err);
      this.bgProgress.error++;
    } finally {
      this.bgProgress.total++;
    }
  }

  async findAll(): Promise<ProfitTransactionEntity[]> {
    return await this.profitTransactionRepo.find({ relations: ['tx'] });
  }

  async findOne(id: number): Promise<ProfitTransactionEntity> {
    /*
    await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(1)
    .add(3);
     */
    return await this.profitTransactionRepo.findOne(id, { relations: ['tx'] });
  }

  async create(data: ProfitTransactionEntity) {
    await this.profitTransactionRepo.save(data);
  }

}
