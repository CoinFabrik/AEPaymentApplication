import {Injectable} from '@nestjs/common';
import {Actor, CClient} from "./client.entity";
import {CustomerChannel, MerchantChannel, MyChannel, sleep} from "./channel";
import {get_private, get_public} from "../tools";
import {EventEmitter} from 'events';

const AE = 100;

// aweil@pc18:~/repos/ea$ aecli account -u http://10.10.0.79:3001 create user1
// Address_________________________________ ak_2P4nHG1oC15Ng9aQUuh9xNCF52JUgevnYuJdUR3w4em3YaeaDo
// Path____________________________________ /home/aweil/repos/ea/user1
//
// aweil@pc18:~/repos/ea$ aecli account -u http://10.10.0.79:3001 create user2
// Address_________________________________ ak_71ZZP4ZKBhupJhWZKxFMTFWq6qE8Y9zddjQYR3tBqvBFvvpy8
// Path____________________________________ /home/aweil/repos/ea/user2
//
// aweil@pc18:~/repos/ea$ aecli account -u http://10.10.0.79:3001 create service
// Address_________________________________ ak_dfLvALARoMJs4kvKDkvjdf6Crvs9pAqJYEv3WsxMHM9hNw4DK
// Path____________________________________ /home/aweil/repos/ea/service


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
            this.on("connection", (peer) => {
               this.loop(peer);
            });

        }).catch(console.error);
    }

    async init() {
        this.c = await CClient.FromFile(this.name);
        return "ChannelServer ready!"
    }

    loop(peer: MyChannel) {
        peer.setService(this.service);
        this._loop(client).then(console.log).catch(console.error);
    }

    async _loop(peer: MyChannel) {
        await peer.init();
        await peer.initChannel();
        await peer.wait_state("OPEN");
        //let peer = await this.async_connect(client);
        while (true) {
            await sleep(1000);
            await peer.sendMessage( {
                from: "hub", fromId:this.c.address,
                to: "consumer", toId: client.address,
                type: "h2c-buy-request",
                id: "asdfasd-asdfasdfasdf-asdfasdf-asdf",
                something: [{"quantity": 2, "product":"beer"}],
                amount: 2*AE,
            });
        }
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
        console.log("Adding:", c)
        ServiceBase.clients = ServiceBase.clients.concat([c]);
    }

    rmClient(c: CClient): void {
        array_rm(ServiceBase.clients, c);
    }
}


@Injectable()
export class ClientService extends ServiceBase {
    c: CClient;
    static m: ChannelServer;

    onModuleInit() {
        asyncModuleInit().then(() => {
            ClientService.m = new ChannelServer("service", this);
            console.log(`The module has been initialized.`);
        }).catch(console.error);
    }

    async asyncModuleInit() {
        let pub = get_public("service");
        let priv = get_public("private");
        await MyChannel.Init(pub, priv);
    }


    connect(toClient: CClient, clientType: Actor): string {
        ClientService.m.emit(clientType+"-connection", toClient);
        return "ok"
    }

    static async test() {
        console.log(await get_private("service"));
    }
}

