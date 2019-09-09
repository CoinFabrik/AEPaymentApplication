import {Column, Entity, getRepository, Index, PrimaryGeneratedColumn, Repository} from 'typeorm';
import {get_private, get_public, voidf} from "../tools";
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
  private private?: string;
  public channel: ServerChannel;
  public amount: string;

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  address: string;

  @Column()
  kind: Actor;

  @Column({nullable: true})
  name: string;

  @Column({nullable: true})
  channelId: string;

  @Column({nullable: true})
  channelSt: string;

  @Column({nullable: true})
  channelRn: number;

  @Column({nullable: true})
  iBalance: string;

  @Column({nullable: true})
  rBalance: string;

  private constructor() {}

  static async Get(address: string, kind: Actor): Promise<CClient> {
      let client = this.OnlineClients[kind][address];
      if (client==null) {
          const repo: Repository<CClient> = getRepository<CClient>(CClient);
          client = await repo.findOne({address, kind});
      }
      return client;
  }

  static async GetOrCreate(address: string, kind: Actor, amount: string, name?: string): Promise<CClient> {
      let update = false;
      let client = await this.Get(address, kind);
      if (client===undefined) {
          if (name===undefined) {
              throw new Error('No name specified!');
          }
          client = new CClient();
          client.address = address;
          client.kind = kind;
          client = await client.tsave();
          this.OnlineClients[kind][address] = client;
      }

      if((name !== undefined) && (name !== client.name)) {
          client.name = name;
          update = true;
      }
      if((amount !== undefined) && (amount !== client.amount)) {
          client.amount = amount;
          update = true;
      }

      if (update) {
          await client.tsave();
      }
      return client;
  }

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

  save() {
      this.tsave().then(voidf).catch(console.error);
  }

  async tsave() { //repo?: Repository<CClient>) {
      let repo: Repository<CClient> = getRepository<CClient>(CClient);
      try {
          return await repo.save(this);
      } catch (err) {
          console.log("CANT SAVE: cclient:", JSON.stringify(this))
          console.log(err)
      }
  }

  setChannelOptions(opts: object) {
    if ((this.channelSt!=null)&&(this.channelSt!=="")&&(this.channelId!=="")) {
        opts["offchainTx"] = this.channelSt;
        opts["existingChannelId"] = this.channelId;
    }
  }

  isReestablish(opts: object): boolean {
      return (opts["offchainTx"]!=null) && (opts["existingChannelId"]!=null);
  }
}
