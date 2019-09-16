import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MerchantCustomerAccepted } from '../../client/mca.entity';
import { ClosedTransactionEntity } from './closedTransactions.entity';

@Entity()
export class ProfitTransactionEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column() createdAt: Date = new Date();

  @Column({ length: 500 })
  readonly profitTxId: string;

  @OneToOne(type => ClosedTransactionEntity)
  @JoinColumn()
  closeTx: ClosedTransactionEntity;

  constructor(closeTx: ClosedTransactionEntity, profitTxId: string) {
    this.closeTx = closeTx;
    this.profitTxId = profitTxId;
  }
}
