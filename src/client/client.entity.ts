import {Entity, Column, PrimaryGeneratedColumn, Index} from 'typeorm';
import {get_private, get_public} from "../tools";
import {promises} from "fs";
import {ServerChannel} from "./channel";

export type Actor = "merchant"|"customer"|"hub";
export const AE = 100;

// interface Message {
//     from: Actor;
//     fromId: string;
//     to: Actor;
//     toId: string;
//     msg: MsgKind;
//     id: string;   // uuid for tx
//
//     something: any;
//     amount: string;
//
//     merchant: string;  // to be hub defined
//     customer: string;  // to be hub defined
// }


export class PaymentTimeout extends Error {}
export class InvalidRequest extends Error {}
export class InvalidMerchant extends InvalidRequest{}
export class InvalidCustomer extends InvalidRequest{}




@Entity()
export class CClient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  address: string;

  @Column()
  kind: Actor;

  name: string;
  private?: string;
  public channel: ServerChannel;
  public amount: string;

  static async FromFile(name: string): Promise<CClient> {
    let client = new CClient();
    client.address = await get_public(name);
    client.name = name;
    client.private = await get_private(name);
    client.kind = "hub";
    return client;
  }

  setChannel(c: ServerChannel) {
      this.channel = c;
  }
}


@Entity()
@Index(["merchant", "customer"])
@Index(["tx_uuid"], { unique: true })
export class MerchantCustomerAccepted {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    merchant: string;
    @Column()
    customer: string;

    @Column()
    tx_uuid: string;

    @Column()
    timestamp: number;
    @Column()
    amount: string;
    @Column()
    item: string;

    static Create(merchant, customer, uuid, amount:string, item: object) {
      const mca = new MerchantCustomerAccepted();
      mca.merchant = merchant;
      mca.customer = customer;
      mca.amount = amount;
      mca.tx_uuid = uuid;
      mca.timestamp = Date.now();
      mca.item = JSON.stringify(item);
      return mca;
    }
}



