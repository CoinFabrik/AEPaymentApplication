/* tslint:disable:whitespace */
import {Entity, Column, PrimaryGeneratedColumn, Index, getRepository, Repository} from 'typeorm';
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
export class InvalidRequest extends Error {
    constructor(message?: string) {
        if (message==undefined) { message = "" }
        super("Invalid Request("+message+")");
    }
}
export class InvalidMerchant extends InvalidRequest{
    constructor(message?: string) {
        if (message==undefined) { message = "" }
        super("Invalid merchant("+message+")");
    }
}
export class InvalidCustomer extends InvalidRequest{
    constructor(message?: string) {
        if (message==undefined) { message = "" }
        super("Invalid customer("+message+")");
    }
}


@Entity()
@Index(["address", "kind"], { unique: true })
export class CClient {
  static OnlineClients = {'customer': {}, 'merchant': {}};

  static async GetOrCreate(address: string, kind: Actor, amount: string, name?: string): Promise<CClient> {
      let save = false;
      let update = false;
      let client = this.OnlineClients[kind][address];
      if (client==null) {
          const repo: Repository<CClient> = getRepository<CClient>(CClient);
          client = await repo.findOne({address, kind});
          if (client===undefined) {
              client = new CClient();
              client.address = address;
              client.kind = kind;
              if (name===undefined) {
                  throw new Error('No name specified!');
              }
              save = true;
          }
      }

      if((name !== undefined) && (name !== client.name)) {
          client.name = name;
          update = true;
      }
      if((amount !== undefined) && (amount !== client.amount)) {
          client.amount = amount;
          update = true;
      }

      if (save || update) {
          const result = await client.tsave();
          if (save) {
              client = result;
              this.OnlineClients[kind][address] = result;
          }
      }
      return client;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  address: string;

  @Column()
  kind: Actor;

  @Column({nullable: true})
  name: string;

  private private?: string;
  public channel: ServerChannel;
  public amount: string;

  static async FromFile(name: string): Promise<CClient> {
    const client = new CClient();
    client.address = await get_public(name);
    client.name = name;
    client.private = await get_private(name);
    client.kind = "hub";
    return client;
  }

  setChannel(c: ServerChannel) {
      this.channel = c;
  }

  async get_or_create() {
      let repo: Repository<CClient> = getRepository<CClient>(CClient);
      let entity = await repo.findOne({address: this.address, kind: this.kind});
      if (entity!=undefined) {
          this.id = entity.id;
          if ((this.name==undefined) || (this.name.length==0)) {
              this.name = entity.name;
              return;
          } else {
              entity.name = this.name;
          }
      }
      await this.tsave();
  }

  async tsave() { //repo?: Repository<CClient>) {
      const repo: Repository<CClient> = getRepository<CClient>(CClient);
      await repo.save(this);
  }
}


@Entity()
@Index(["merchant"])
@Index(["customer"])
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

    static Create(merchant, customer, uuid, amount: string, item: object) {
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



