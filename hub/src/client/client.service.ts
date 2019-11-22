import {Injectable} from '@nestjs/common';
import {Actor, CClient} from './client.entity';
import {CustomerChannel, MerchantChannel, ServerChannel} from './channel';
import {EventEmitter} from 'events';
import {array_rm, Dictionary, sleep, voidf} from '../tools';
import {FindManyOptions, getManager, getRepository} from 'typeorm';
import BigNumber from 'bignumber.js';
import {Hub} from './hub';
import {MerchantCustomerAccepted} from './mca.entity';

export class RepoService {
  static async save(m: MerchantCustomerAccepted): Promise<boolean> {
      const repo = getRepository(MerchantCustomerAccepted);
      let idx = 0;
      while (idx < 100) {
          let theErr;
          try {
              await repo.save(m);
              return true;
          } catch (err) {
              theErr = err;
              idx += 1;
              await sleep(100 * idx);
          }
          console.log('Persistent error:');
          console.log(theErr);
      }
      return false;
  }

  static async MerchantBalance(merchant: string): Promise<BigNumber> {
      const repo = getRepository(MerchantCustomerAccepted);
      const all = await repo.find({merchant});
      let sum = new BigNumber('0');
      for (const mca of all) {
          sum = sum.plus(new BigNumber(mca.amount));
      }
      return sum;
  }

  static async AllMerchants(): Promise<string[]> {
      return this._query_actor('merchant');
  }

  static async AllCustomers(): Promise<string[]> {
      return this._query_actor('customer');
  }

  static async _query_actor(kind: Actor): Promise<string[]> {
      const repo = getRepository(MerchantCustomerAccepted);
      return repo.createQueryBuilder(kind).select('DISTINCT(?)', kind).getRawMany();
  }

  static async getHistory(kind: Actor, address: string, start= '0', take= '10'): Promise<object[]> {
      const name_field = kind == 'merchant' ? 'customer' : 'merchant';
      const nstart = Number.parseInt(start);
      const ntake = Number.parseInt(take);

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
      const q = 'SELECT ' +   // "mca"."id" AS "mca_id",
                        '"mca"."' + name_field + '" AS "peer", ' +
                        '"mca"."timestamp" AS "timestamp", ' +
                        '"mca"."amount" AS "amount", ' +
                        '"mca"."item" AS "item", ' +
                        '"client"."name" AS "name", ' +
                        '"mca"."tx_uuid" AS "uuid" ' +
                    'FROM "merchant_customer_accepted" "mca" ' +
                    'LEFT JOIN "c_client" "client" ON "client"."address" = peer ' +
                    'WHERE ' + kind + ' = ? ' +  //  AND  "client"."kind" = \'' + name_field + '\'
                    'ORDER BY timestamp DESC LIMIT ? OFFSET ?';
      console.log(q);
      return getManager().query(q, [address, ntake, nstart]);
  }

    static async clearance_list() {
      const repo = getRepository(MerchantCustomerAccepted);
      const balances: Dictionary<BigNumber> = {};
      const merchants = [];
      const results = [];
      let current;

      for (const mca of await repo.find()) {
        const merchant = mca.merchant;

        if ((merchant == null) || (mca.customer == null)) {
            // ignore customers
            // and ignore merchant deposits
            continue;
        }

        current = balances[merchant];
        if (current == null) {
            current = new BigNumber('0');
            merchants.push(merchant);
        }
        balances[merchant] = new BigNumber(mca.amount).plus(current);
      }
      merchants.sort();

      const q = new BigNumber(10).exponentiatedBy(18);

      for (const merchant of merchants) {
          results.push([merchant, balances[merchant].toString(10),
              balances[merchant].dividedBy(q).toString(10),
          ]);
      }
      return results;
    }
}

export class ServiceBase extends EventEmitter {
    static clients: { 'customer': CClient[], 'merchant': CClient[] } = {
        customer: [], merchant: [] };
    static pending: { 'customer': CClient[], 'merchant': CClient[] } = {
        customer: [], merchant: [] };

    static getClients(kind: Actor): CClient[] {
        return ServiceBase.clients[kind];
    }

    getClients(kind: Actor): CClient[] {
        return ServiceBase.getClients(kind);
    }

    static getClientByAddress(address: string, kind: Actor): CClient {
        if (address == undefined) {
            throw new Error('Looking for no client: ' + kind);
        }
        for (const cc of ServiceBase.clients[kind]) {
            if (cc.address == address) {
                return cc;
            }
        }
        return null;
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

    static async leaveAll() {
        return await this.aForAll(c => c.channel.leave('global'));
    }

    static async aForAll(f) {
        for (const kind of ['merchant', 'customer']) {
            for (const c of ServiceBase.clients[kind] ) {
                try {
                    await f(c, kind);
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }

    static forAll(f) {
        for (const kind of ['merchant', 'customer']) {
            for (const c of ServiceBase.clients[kind] ) {
                f(c, kind);
            }
        }
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
        if (clientType == undefined) {
            clientType = toClient.kind;
        } else {
            if (clientType !== toClient.kind) {
                throw new Error(`Invalid kind:  ${clientType}, ${toClient.kind}  !!!`);
            }
        }
        ServiceBase.addPending(toClient, toClient.kind);
        this.emit(toClient.kind + '-connection', toClient);
        return ServerChannel.GetInfo(toClient);
    }

    constructor() {
        super();
        this.on('customer-connection', (client: CClient) => {
            const peer = new CustomerChannel(client);
            this.emit('connect', peer);
        });
        this.on('merchant-connection', (client: CClient) => {
            const peer = new MerchantChannel(client);
            this.emit('connect', peer);
        });
        this.on('connect', (peer: ServerChannel) => {
            peer.initChannel();
        });
    }

    static async test() {
    }

    // async queryClient(address: string, kind: Actor): Promise<CClient> {
    //     let repo = getRepository(CClient);
    //     return await repo.findOne({address:address, kind: kind});
    // }
    //
    async queryClients(kind: Actor): Promise<CClient[]> {
        const repo = getRepository(CClient);
        return await repo.find({kind});
    }

    onApplicationShutdown(signal: string) {
        console.log(signal); // e.g. "SIGINT"
        ServiceBase.leaveAll()
            .then(() => {})
            .catch(console.error);
    }
}
