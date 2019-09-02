import {Injectable} from '@nestjs/common';
import {Actor, CClient, MerchantCustomerAccepted} from "./client.entity";
import {CustomerChannel, MerchantChannel, ServerChannel} from "./channel";
import {EventEmitter} from 'events';
import {array_rm, voidf} from "../tools";
import {FindManyOptions, getManager, getRepository} from "typeorm";
import BigNumber from "bignumber.js";
import {Hub} from "./hub";




export class RepoService {
  static async save(m: MerchantCustomerAccepted): Promise<boolean> {
      let repo = getRepository(MerchantCustomerAccepted);
      let idx = 0;
      while(idx<100) {
          try {
              await repo.save(m);
              return true;
          } catch (err) {
              idx += 1;
          }
      }
      return false;
  }

  static async MerchantBalance(merchant: string): Promise<BigNumber> {
      let repo = getRepository(MerchantCustomerAccepted);
      let all = await repo.find({merchant: merchant});
      let sum = new BigNumber("0");
      for (let mca of all) {
          sum = sum.plus(new BigNumber(mca.amount));
      }
      return sum;
  }

  static async AllMerchants(): Promise<string[]> {
      return this._query_actor("merchant");
  }

  static async AllCustomers(): Promise<string[]> {
      return this._query_actor("customer");
  }

  static async _query_actor(kind: Actor): Promise<string[]> {
      let repo = getRepository(MerchantCustomerAccepted);
      return repo.createQueryBuilder(kind).select("DISTINCT(?)", kind).getRawMany();
  }

  static async getHistory(kind: Actor, address: string, start="0", take="10"): Promise<object[]> {
      let name_field = kind=="merchant"? "customer" : "merchant";
      let nstart = Number.parseInt(start);
      let ntake = Number.parseInt(take);

      // query builder version fails to export columns from joined table.. and when using
      // rawquerymany(), cannot be paginated.
      //
      // let repo = getRepository(MerchantCustomerAccepted);
      // // we should be doing this, but:
      // //   -  with getrawmany() doesn't honor start/take
      // //   -  getmany() doesn't return joined table columns..
      // //
      // let select = ["timestamp", "merchant", "customer", "amount", "item"];
      // select = ["mca.id", "mca.timestamp", "mca.merchant", "mca.customer", "mca.amount",
      //           "mca.item", "client.name"]
      // array_rm(select, "mca."+kind);
      // let query = repo.createQueryBuilder("mca")
      //     .leftJoinAndSelect(CClient, "client", "client.address = mca."+name_field)
      //     // .select(["mca.timestamp", "mca.merchant", "mca.customer", "mca.amount", "mca.item"])
      //     .select(select)
      //     .where(kind+" = :address", {address:address})
      //     // .orderBy("mca.timestamp", "DESC")
      //     .skip(nstart)
      //     .take(ntake);
      // console.log(query.getQueryAndParameters())
      // // return await query.getRawMany();

      // this doesn't returns customer or merchant's name..
      //
      // let where: object;
      // if (kind=="merchant") {
      //   where = {merchant: address}
      // } else {
      //   where = {customer: address}
      // }
      //
      // let opts : FindManyOptions<MerchantCustomerAccepted> = {
      //     where: where,
      //     order: {
      //         timestamp: "DESC"
      //     },
      //     skip: nstart,
      //     take: ntake
      // };
      // return await repo.find(opts);
    return getManager().query(
          'SELECT ' +   //"mca"."id" AS "mca_id",
                        '"mca"."'+name_field+'" AS "peer", ' +
                        '"mca"."timestamp" AS "timestamp", ' +
                        '"mca"."amount" AS "amount", ' +
                        '"mca"."item" AS "item", ' +
                        '"client"."name" AS "name", ' +
                        '"mca"."tx_uuid" AS "uuid" ' +
                    'FROM "merchant_customer_accepted" "mca" ' +
                    'LEFT JOIN "c_client" "client" ON "client"."address" = peer ' +
                    'WHERE '+kind+' = ?' +
                    'ORDER BY timestamp DESC LIMIT ? OFFSET ?',
                    [address, ntake, nstart]
      );
  }
}


export class ServiceBase extends EventEmitter {
    static clients: { "customer": CClient[], "merchant": CClient[] } = {
        "customer":[], "merchant":[] };
    static pending: { "customer": CClient[], "merchant": CClient[] } = {
        "customer":[], "merchant":[] };

    static getClients(kind: Actor): CClient[] {
        return ServiceBase.getClients(kind);
    }
    // getClientByAddress(address:string, kind: Actor): CClient {
    //     return ServiceBase.getClientByAddress(address, kind);
    // }
    // addClient(c: CClient, kind: Actor): void {
    //     return ServiceBase.addClient(c, kind);
    // }
    // rmClient(c: CClient, kind: Actor): void {
    //     return ServiceBase.rmClient(c, kind);
    // }

    getClients(kind: Actor): CClient[] {
        return ServiceBase.clients[kind];
    }

    static getClientByAddress(address:string, kind: Actor): CClient {
        if (address==undefined) {
            throw new Error("Looking for no client: "+kind)
        }
        for(let cc of ServiceBase.clients[kind]) {
            if(cc.address==address) {
                return cc;
            }
        }
        return null;
    }

    isOnOrPendingClientByAddress(address:string, kind: Actor): boolean {
        if (address==undefined) {
            throw new Error("Looking for no client!!!!!!")
        }
        for(let cc of ServiceBase.pending[kind]) {
            if(cc.address==address) {
                return true;
            }
        }
        for(let cc of ServiceBase.clients[kind]) {
            if(cc.address==address) {
                return true;
            }
        }
        return false;
    }

    static addPending(c: CClient, kind: Actor): void {
        ServiceBase.pending[kind] = ServiceBase.pending[kind].concat([c]);
    }

    static addClient(c: CClient, kind: Actor): void {
        ServiceBase.rmPending(c, kind);
        ServiceBase.clients[kind] = ServiceBase.clients[kind].concat([c]);
    }

    static rmClient(c: CClient, kind: Actor): void {
        array_rm(ServiceBase.clients[kind], c);
    }

    static rmPending(c: CClient, kind: Actor): void {
        array_rm(ServiceBase.pending[kind], c);
    }
}



@Injectable()
export class ClientService extends ServiceBase {
    onModuleInit() {
        Hub.Create(this);
        ServerChannel.Init()
            .then(voidf).catch(console.error);
    }

    connect(toClient: CClient, clientType?: Actor): object {
        if (clientType==undefined) {
            clientType = toClient.kind;
        } else {
            if (clientType!==toClient.kind) {
                throw new Error(`Invalid kind:  ${clientType}, ${toClient.kind}  !!!`);
            }
        }
        ServiceBase.addPending(toClient, toClient.kind);
        this.emit(toClient.kind + "-connection", toClient);
        return ServerChannel.GetInfo();
    }

    constructor() {
        super();
        this.on("customer-connection", (client: CClient) => {
            let peer = new CustomerChannel(client);
            this.emit("connect", peer);
        });
        this.on("merchant-connection", (client: CClient) => {
            let peer = new MerchantChannel(client);
            this.emit("connect", peer);
        });
        this.on("connect", (peer: ServerChannel) => {
            peer.client.get_or_create().then(voidf).catch(console.error);
            peer.initChannel(this);
        });
    }

    static async test() {
    }

    async queryClient(address: string, kind: Actor): Promise<CClient> {
        let repo = getRepository(CClient);
        return await repo.findOne({address:address, kind: kind});
    }

    async queryClients(kind: Actor): Promise<CClient[]> {
        let repo = getRepository(CClient);
        return await repo.find({kind: kind});
    }

}
