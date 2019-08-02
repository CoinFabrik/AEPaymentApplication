import {Injectable, Logger} from '@nestjs/common';
import {Actor, CClient} from "./client.entity";
import {ACCOUNT, CustomerChannel, MerchantChannel, ServerChannel} from "./channel";
import {EventEmitter} from 'events';


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

const voidf = () => {}

class MerchantCustomer {
    readonly id: string;
    static all:{[key: string]: MerchantCustomer} = {};

    constructor(readonly merchant: string, readonly customer: string, public msg: object,
                private _mclient?: CClient, private _cclient?: CClient) {
        this.id = Guid.generate();
        MerchantCustomer.save(this);
    }

    static save(mc: MerchantCustomer){
        this.all[mc.id] = mc;
    }

    base() {
        return {
            "merchant": this.merchant,
            "customer": this.customer,
        }
    }

    forwardBuyRequestToCustomer(msg: object) {
        let base = this.base();
        base["id"]= this.id;
        base["type"]= "buy-request";
        base["amount"]= msg["info"]["amount"];
        base["something"]= msg["info"]["something"];
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

    get mclient():CClient {
        if(this._mclient==null) {
            this._mclient = ClientService.getClientByAddress(this.merchant, "merchant");
        }
        return this._mclient;
    }

    get cclient():CClient {
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

    async wait_payment(mc:MerchantCustomer, update_result) {

    }

    private setup() {
        this.on("signed", (msg)=> {
            this.log("signed:"+  JSON.stringify(msg));
        });

        this.on("wait-payment", (mc, update_result)=> {
            this.wait_payment(mc, update_result)
                .then(()=> {this.emit("payment-done",mc)}).catch(console.error)
        });

        this.on("buy-request", (msg)=> {
            // {
            //  "channel_id":"ch_msNnmj5zz8qUq7Se9ijy2ziyta5GUgY6fh9mMcz6cd9qAHVdQ",
            //  "from":"ak_2c98cs9skoK5W5ugwabipd2XCNxfnPsQx8BBPWhBAafHpvwf4r",
            //  "info":{
            //      "amount":500000,
            //      "something": [ {"what":"beer","quantity":2} ],
            //      "toId":"ak_9k9FzYxNbwrXYLVB8EDjhjspZbKzG9zWDTydqHVkDRR8To5Hs",
            //      "type":"buy-request",
            //      "from":"merchant",
            //      "to":"hub"},
            //  "to":"ak_2TccoDkdWZ28yBYZ7QsdqBMAH5DjsVnMnZHBRyUnxPD5z1whYb"
            // }
            let mc;
            let response;
            console.log("buy-request: " + (JSON.stringify(msg)));
            try {
                mc = MerchantCustomer.FromMerchantRequest(msg);
                response = mc.forwardBuyRequestToCustomer(msg);
                mc.sendCustomer( response );
                mc.cclient.channel.sendTxRequest(msg["info"]["amount"]).
                    then((update_result) => {
                        this.log("buy-request forwarded!");
                        this.emit("wait-payment", mc, update_result);
                }).catch(console.error);
            } catch (err) {
                this.log("buy-request ignored: "+ err.toString());
                if(mc!=null) {
                    mc.sendMerchant( mc.errorMsg(err) );
                }
            }
        });
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

