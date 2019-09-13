import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { MerchantCustomerAccepted } from '../client/mca.entity';

@Entity()
export class ClosedTransactionEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column() createdAt: Date = new Date();

  @Column({ length: 500 })
  readonly closeTxId: string;

  @OneToOne(type => MerchantCustomerAccepted)
  @JoinColumn()
  tx: MerchantCustomerAccepted;

  constructor(tx: MerchantCustomerAccepted, closeTxId: string) {
    this.tx = tx;
    this.closeTxId = closeTxId;
  }
}
