import {Injectable, Logger} from '@nestjs/common';
import {Actor, CClient} from "./client.entity";
import {CustomerChannel, MerchantChannel, ServerChannel} from "./channel";
import {get_private} from "../tools";
import {EventEmitter} from 'events';


class ChannelServer extends EventEmitter {
    private c: CClient;

    get pub(): string {
        return this.c.address;
    }

    constructor(private name: string, private service: Service) {
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

    loop(peer: ServerChannel) {
    }
}


class MerchantCustomer {
    constructor(readonly from: string, readonly to: string, public msg: any) {}
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

    private setup() {
        this.on("buy-request", (msg)=> {
            // {
            //  "channel_id":"ch_msNnmj5zz8qUq7Se9ijy2ziyta5GUgY6fh9mMcz6cd9qAHVdQ",
            //  "from":"ak_2c98cs9skoK5W5ugwabipd2XCNxfnPsQx8BBPWhBAafHpvwf4r",
            //  "info":{
            //      "amount":500000,
            //      "something": [
            //          {"what":"beer","quantity":2}
            //      ],
            //      "toId":"ak_9k9FzYxNbwrXYLVB8EDjhjspZbKzG9zWDTydqHVkDRR8To5Hs",
            //      "type":"buy-request",
            //      "from":"merchant",
            //      "to":"hub"},
            //  "to":"ak_2TccoDkdWZ28yBYZ7QsdqBMAH5DjsVnMnZHBRyUnxPD5z1whYb"
            // }
            console.log("buy-request: " + (JSON.stringify(msg)));
            //validadte buy-request
            //validate parties:
            let merchant = msg["from"];
            let mclient = this.service.getClientByAddress(merchant, "merchant");
            if(mclient==null) {
                this.log("invalid merchant: "+merchant);
                return;
            }

            let customer = msg["info"]["toId"];
            let cclient = this.service.getClientByAddress(customer, "customer");

            if(customer==null) {
                let resp = "invalid customer: "+msg["from"];
                this.log(resp);
                mclient.channel.sendMessage({
                    "error": resp
                }).then(this.log).catch(this.log);
                return
            }

            // forward
            cclient.channel.sendMessage({
                "amount": msg["info"]["amount"],
                "type": "buy-request"
            }).then(() => {this.log("request forwarded!")}).catch((err)=>{this.log("something wrong:"+err)});
        });
    }
}


export interface Service {
    addClient(c: CClient, kind: Actor): void;

    rmClient(c: CClient, kind: Actor): void;
}

function array_rm(lst: any[], x: any): void {
    let idx = lst.indexOf(x);
    while (idx >= 0) {
        lst.splice(idx, 1);
        idx = lst.indexOf(x);
    }
}


class ServiceBase implements Service {
    static clients: { "customer": CClient[], "merchant": CClient[] } = {
        "customer":[],
        "merchant":[],
    };

    getClients(kind: Actor): CClient[] {
        return ServiceBase.clients[kind];
    }

    checkMerchant(address: string): boolean {
        return this.getClientByAddress(address, "merchant")!=null;
    }

    checkCustomer(address: string): boolean {
        return this.getClientByAddress(address, "customer")!=null;
    }

    getClientByAddress(address:string, kind: Actor): CClient {
        for(let cc of ServiceBase.clients[kind]) {
            if(cc.address==address)
                return cc;
        }
        return null;
    }

    addClient(c: CClient, kind: Actor): void {
        ServiceBase.clients[kind] = ServiceBase.clients[kind].concat([c]);
    }

    rmClient(c: CClient, kind: Actor): void {
        array_rm(ServiceBase.clients[kind], c);
    }
}


@Injectable()
export class ClientService extends ServiceBase {
    static m: ChannelServer;

    onModuleInit() {
        Hub.Create(this);
        this.asyncModuleInit().then(() => {
            ClientService.m = new ChannelServer("service", this);
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
        console.log(await get_private("service"));
    }
}

