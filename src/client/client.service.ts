import {Injectable, Logger} from '@nestjs/common';
import {
    Actor,
    CClient,
    InvalidCustomer,
    InvalidMerchant,
    MerchantCustomerAccepted,
    PaymentTimeout
} from "./client.entity";
import {CustomerChannel, MerchantChannel, ServerChannel} from "./channel";
import {EventEmitter} from 'events';
import {array_rm, clone, sleep, voidf} from "../tools";
import {getRepository, Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import BigNumber from "bignumber.js";


class Guid {
  static generate() {
    return 'xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}


// @Injectable()
// export class MerchantCustomerService {
//   constructor(
//     @InjectRepository(MerchantCustomerAccepted)
//     private readonly repo: Repository<MerchantCustomerAccepted>,
//   ) {}
//
//   async save(m: MerchantCustomerAccepted): Promise<boolean> {
//       let idx = 0;
//       while(idx<100) {
//           try {
//               await this.repo.save(m);
//               return true;
//           } catch (err) {
//               idx += 1;
//           }
//       }
//       return false;
//   }
// }

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
      let all = await repo.find({merchant:merchant});
      let sum = new BigNumber("0");
      for (let mca of all) {
          sum = sum.plus(new BigNumber(mca.amount));
      }
      return sum;
  }

  static async AllMerchants(): Promise<string[]> {
      let repo = getRepository(MerchantCustomerAccepted);
      return repo.createQueryBuilder("merchants").select("DISTINCT(merchant)").getRawMany();
  }

  static async AllCustomers(): Promise<string[]> {
      let repo = getRepository(MerchantCustomerAccepted);
      return repo.createQueryBuilder("customers").select("DISTINCT(customer)").getRawMany();
  }
}

class MerchantCustomer {
    readonly id: string;
    static all:{[key: string]: MerchantCustomer} = {};
    readonly original_msg: object;
    readonly _base: object;

    constructor(readonly merchant: string, readonly customer: string, public msg: object,
                private _mclient?: CClient, private _cclient?: CClient) {
        this.id = Guid.generate();
        MerchantCustomer.save(this);
        this.original_msg = msg;
        this._base = {
            "id": this.id,
            "merchant": this.merchant,
            "merchant_name": this.mclient.name,
            "customer": this.customer,
            "amount": this.original_msg["info"]["amount"],
            "something": this.original_msg["info"]["something"],
        }
    }

    getEntity(): MerchantCustomerAccepted {
        return MerchantCustomerAccepted.Create(this.merchant, this.customer,
            this.id, this.amount.toString(),  // XXX
            this.original_msg["info"]["something"]);
    }

    get amount(): number {
        return this.original_msg["info"]["amount"];
    }
    get amount_str(): string {
        return this.amount.toString();
    }

    base(): object {
        return clone(this._base);
    }

    static save(mc: MerchantCustomer){
        this.all[mc.id] = mc;
    }

    forwardBuyRequestToCustomer(msg: object) {
        let base = this.base();
        base["type"]= "buy-request";
        return base;
    }

    msgPaymentAccepted() {
        let base = this.base();
        base["type"]= "buy-request-accepted";
        return base;
    }

    msgPaymentRejected() {
        let base = this.base();
        base["type"]= "buy-request-rejected";
        return base;
    }

    errorMsg(err: Error): object {
        let base = this.base();
        base["type"] = "error";
        base["msg"] = err.toString;
        return base;
    }

    sendCustomer(msg: object) {
        this.cclient.channel.sendMessage(msg).then(voidf).catch(console.error);
    }

    sendMerchant(msg: object) {
        this.mclient.channel.sendMessage(msg).then(voidf).catch(console.error);
    }

    public get mclient():CClient {
        if(this._mclient==null) {
            this._mclient = ClientService.getClientByAddress(this.merchant, "merchant");
        }
        return this._mclient;
    }

    public get cclient():CClient {
        if(this._cclient==null) {
            this._cclient = ClientService.getClientByAddress(this.customer, "customer");
        }
        return this._cclient;
    }

    static FromMerchantRequest(msg: object): MerchantCustomer {
        let merchant = msg["from"];
        let mclient = ClientService.getClientByAddress(merchant, "merchant");
        if(mclient==null) {
            throw new InvalidMerchant(merchant)
        }
        let customer = msg["info"]["toId"];
        let cclient = ClientService.getClientByAddress(customer, "customer");
        if(cclient==null) {
            throw new InvalidCustomer(customer);
        }
        return new MerchantCustomer(merchant, customer, msg);
    }
}


export class Hub extends EventEmitter {
    private static hub: Hub;
    private logger: Logger;

    private constructor(public service: ClientService) {
        super();
        this.logger = new Logger("Hub");
        this.setup()
    }
    static Get() {
        if (this.hub==undefined) {
            throw Error("Not initialized Hub");
        }
        return this.hub;
    }
    static Create(service: ClientService) {
        if (this.hub!=undefined) {
            throw Error("Already initialized Hub");
        }
        this.hub = new Hub(service);
    }

    log(msg: string) {
        this.logger.log("|" + msg);
    }

    async wait_payment(mc:MerchantCustomer, update_result, pre_balance) {
        const start = Date.now();
        const timeout = 60*1000;
        while(Date.now() - start < timeout) {
            let last_balance = await mc.cclient.channel.hub_balance();
            this.log(`check balance..: ${pre_balance} ${last_balance} to  ${pre_balance+mc.amount}..`);
            if (last_balance>=pre_balance+mc.amount){
                const mca = mc.getEntity();
                await RepoService.save(mca);
                return
            }
            await sleep(1000);
        }
        this.log("Wait for balance timed out...");
        throw new PaymentTimeout();
    }

    async withdraw_payment(mc:MerchantCustomer) {
        let { accepted, signedTx } = await mc.cclient.channel.withdraw(
                                                Number.parseInt(mc.amount_str));
        if (!accepted) {
            throw new Error("cannot remove "+(mc.amount)+ " for merchant: "+mc.merchant);
        }
        let { d_accepted, state } = await mc.mclient.channel.deposit(
                                                Number.parseInt(mc.amount_str));
        if (!d_accepted) {
            throw new Error("cannot deposit into merchant: "+mc.merchant);
        }
    }

    private setup() {
        this.on("buy-request", (msg)=> {
            this.buy_request(msg).then(voidf).catch(console.error);
        });

        this.on("wait-payment", (mc, update_result, pre_balance) => {
            this.wait_payment(mc, update_result, pre_balance)
                .then(()=> {this.emit("payment-done", mc)})
                .catch(()=> {this.emit("payment-failed", mc)});
        });

        this.on("payment-done", (mc)=> {
            mc.sendMerchant(mc.msgPaymentAccepted());
            //this.withdraw_payment(mc).then(voidf).catch(console.error)
        });
        this.on("payment-failed", (mc)=> {
            mc.sendMerchant(mc.msgPaymentRejected());
        });

    }

    async buy_request(msg) {
        let mc;
        let response;
        this.log("buy-request: " + (JSON.stringify(msg)));
        try {
            mc = MerchantCustomer.FromMerchantRequest(msg);
            // after this request was approved
            let pre_balance = await mc.cclient.channel.hub_balance();

            response = mc.forwardBuyRequestToCustomer(msg);
            mc.sendCustomer( response );
            let start = Date.now();
            let update_result = await mc.cclient.channel.sendTxRequest(msg["info"]["amount"]);
            let end = Date.now();
            console.log(" took: ", end-start)
            console.log(JSON.stringify(update_result))
            this.log("buy-request forwarded!");
            this.emit("wait-payment", mc, update_result, pre_balance);
        } catch (err) {
            this.log("buy-request ignored: "+ err.toString());
            if(mc!=null) {
                mc.sendMerchant( mc.errorMsg(err) );
            }
        }
    }


}


export class ServiceBase extends EventEmitter {
    static clients: { "customer": CClient[], "merchant": CClient[] } = {
        "customer":[], "merchant":[] };

    static getClients(kind: Actor): CClient[] {
        return ServiceBase.getClients(kind);
    }
    getClientByAddress(address:string, kind: Actor): CClient {
        return ServiceBase.getClientByAddress(address, kind);
    }
    addClient(c: CClient, kind: Actor): void {
        return ServiceBase.addClient(c, kind);
    }
    rmClient(c: CClient, kind: Actor): void {
        return ServiceBase.rmClient(c, kind);
    }

    //--------------------------------------------
    getClients(kind: Actor): CClient[] {
        return ServiceBase.clients[kind];
    }

    static getClientByAddress(address:string, kind: Actor): CClient {
        for(let cc of ServiceBase.clients[kind]) {
            if(cc.address==address)
                return cc;
        }
        return null;
    }

    static addClient(c: CClient, kind: Actor): void {
        ServiceBase.clients[kind] = ServiceBase.clients[kind].concat([c]);
    }

    static rmClient(c: CClient, kind: Actor): void {
        array_rm(ServiceBase.clients[kind], c);
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
