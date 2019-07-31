import {Injectable} from '@nestjs/common';
import {Actor, CClient} from "./client.entity";
import {CustomerChannel, MerchantChannel, ServerChannel} from "./channel";
import {get_private } from "../tools";
import {EventEmitter} from 'events';


class ChannelServer extends EventEmitter {
    private c: CClient;

    get pub(): string {
        return this.c.address;
    }

    constructor (private name: string, private service: Service) {
        super();
        this.init().then(()=> {

            this.on("customer-connection", (client) => {
                let peer = new CustomerChannel(client);
                this.emit("connect", peer);
            });
            this.on("merchant-connection", (client) => {
                let peer = new MerchantChannel(client);
                this.emit("connect", peer);
            });
            this.on("connect", (peer) => {
               this.loop(peer);
            });

        }).catch(console.error);
    }

    async init() {
        this.c = await CClient.FromFile(this.name);
        return "ChannelServer ready!"
    }

    loop(peer: ServerChannel) {
        peer.setService(this.service);
        peer.loop().then(console.log).catch(console.error);
    }
}


export interface Service {
    addClient(c: CClient): void;
    rmClient(c: CClient): void;
}

function array_rm(lst:any[], x:any): void {
    let idx = lst.indexOf(x);
    while (idx>=0) {
        lst.splice(idx, 1);
        idx = lst.indexOf(x);
    }
}


class ServiceBase implements Service {
    static clients: CClient[] = [];

    getClients(): CClient[] {
        return ServiceBase.clients;
    }

    addClient(c: CClient): void {
        ServiceBase.clients = ServiceBase.clients.concat([c]);
    }

    rmClient(c: CClient): void {
        array_rm(ServiceBase.clients, c);
    }
}


@Injectable()
export class ClientService extends ServiceBase {
    static m: ChannelServer;

    onModuleInit() {
        this.asyncModuleInit().then(() => {
            ClientService.m = new ChannelServer("service", this);
            console.log(`The module has been initialized.`);
        }).catch(console.error);
    }

    async asyncModuleInit() {
        await ServerChannel.Init();
    }

    connect(toClient: CClient, clientType: Actor): object {
        ClientService.m.emit(clientType+"-connection", toClient);
        return ServerChannel.GetInfo();
    }

    static async test() {
        console.log(await get_private("service"));
    }
}

