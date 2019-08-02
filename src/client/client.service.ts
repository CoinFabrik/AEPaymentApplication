import {Injectable, Logger} from '@nestjs/common';
import {Actor, CClient} from "./client.entity";
import {ACCOUNT, CustomerChannel, MerchantChannel, ServerChannel} from "./channel";
import {EventEmitter} from 'events';
import {clone, sleep} from "../tools";


class Guid {
  static generate() {
    return 'xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}



class ChannelServer extends EventEmitter {
    private c: CClient;

    get pub(): string {
        return this.c.address;
    }

    constructor(private name: string, private service: ServiceBase) {
        super();
        this.init().then(() => {
            this.on("customer-connection", (client) => {
                let peer = new CustomerChannel(client);
                this.emit("connect", peer);
            });
            this.on("merchant-connection", (client) => {
                let peer = new MerchantChannel(client);
                this.emit("connect", peer);
            });
            this.on("connect", (peer) => {
                peer.initChannel(this.service)
            });

        }).catch(console.error);
    }

    async init() {
        this.c = await CClient.FromFile(this.name);
        return "ChannelServer ready!"
    }
}


class InvalidRequest extends Error {
}

class InvalidMerchant extends InvalidRequest{
}

class InvalidCustomer extends InvalidRequest{
}

class PaymentTimeout extends Error {}

const voidf = () => {}

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
            "customer": this.customer,
            "amount": this.original_msg["info"]["amount"],
            "something": this.original_msg["info"]["something"],
        }
    }

    get amount(): string {
        return this.original_msg["amount"].toString();
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

    static FromMerchantRequest(msg: object) {
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

    private constructor(private service: ServiceBase) {
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
    static Create(service: ServiceBase) {
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
            console.log("LAST BALANCE:", pre_balance, last_balance, "to", pre_balance+mc.original_msg["amount"]);
            if (last_balance>=pre_balance+mc.original_msg["amount"]){
                return
            }
            await sleep(1000);
        }
        throw new PaymentTimeout();
    }

    async withdraw_payment(mc:MerchantCustomer) {
        let { accepted, signedTx } = await mc.cclient.channel.withdraw(mc.amount);
        if (!accepted) {
            throw new Error("cannot remove "+(mc.amount)+ " for merchant: "+mc.merchant);
        }
        let { d_accepted, state } = await mc.mclient.channel.deposit(mc.amount);
        if (!d_accepted) {
            throw new Error("cannot deposit into merchant: "+mc.merchant);
        }
    }

    private setup() {
        this.on("signed", (msg)=> {
            this.log("signed:"+  JSON.stringify(msg));
        });

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
            this.withdraw_payment(mc).then(voidf).catch(console.error)
        });
        this.on("payment-failed", (mc)=> {
            mc.sendMerchant(mc.msgPaymentRejected());
        });

    }

    async buy_request(msg) {
        let mc;
        let response;
        console.log("buy-request: " + (JSON.stringify(msg)));
        try {
            mc = MerchantCustomer.FromMerchantRequest(msg);
            // after this request was approved
            let pre_balance = await mc.cclient.channel.hub_balance();

            response = mc.forwardBuyRequestToCustomer(msg);
            mc.sendCustomer( response );
            mc.cclient.channel.sendTxRequest(msg["info"]["amount"]).
                then((update_result) => {
                    this.log("buy-request forwarded!");
                    this.emit("wait-payment", mc, update_result, pre_balance);
            }).catch(console.error);
        } catch (err) {
            this.log("buy-request ignored: "+ err.toString());
            if(mc!=null) {
                mc.sendMerchant( mc.errorMsg(err) );
            }
        }
    }


}


function array_rm(lst: any[], x: any): void {
    let idx = lst.indexOf(x);
    while (idx >= 0) {
        lst.splice(idx, 1);
        idx = lst.indexOf(x);
    }
}


export class ServiceBase {
    static clients: { "customer": CClient[], "merchant": CClient[] } = {
        "customer":[],
        "merchant":[],
    };

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
    static m: ChannelServer;

    onModuleInit() {
        Hub.Create(this);
        this.asyncModuleInit().then(() => {
            ClientService.m = new ChannelServer(ACCOUNT, this);
            console.log(`The module has been initialized.`);
        }).catch(console.error);
    }

    async asyncModuleInit() {
        await ServerChannel.Init();
    }

    connect(toClient: CClient, clientType: Actor): object {
        ClientService.m.emit(clientType + "-connection", toClient);
        return ServerChannel.GetInfo();
    }

    static async test() {
    }
}

