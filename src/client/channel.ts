import {Service} from "./client.service";
import {AE, CClient} from "./client.entity";

const NETWORK_ID = 'ae_devnet';
const {
    Channel,
    Crypto,
    Universal
} = require('@aeternity/aepp-sdk');

const i_addr = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU';
const r_addr = 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk';
const i_secretKey = 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca';
const r_secretKey = '7c6e602a94f30e4ea7edabe4376314f69ba7eaa2f355ecedb339df847b6f0d80575f81ffb0a297b7725dc671da0b1769b1fc5cbe45385c7b5ad1fc2eaf1d609d';

const port=3001;
let URL = '10.10.0.79:'+port;
const API_URL = "http://" + URL;
const WS_URL = "ws://" + URL;  // http is ok too
const INTERNAL_API_URL = API_URL;
const compilerURL = 'https://compiler.aepps.com';


export async function sleep(ms) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(resolve, ms)
        } catch (err) {
            reject(err)
        }
    });
}

async function wait_for(func) {
    while (!func()) {
        await sleep(100);
    }
}

export abstract class MyChannel {
    is_initiator: boolean;
    channel: any;
    status: string;
    private service: Service;
    public client: CClient;

    static _nodeuser: any;
    static pubkey;
    static privkey;

    static async Init(pubkey, privkey) {
        MyChannel.pubkey = pubkey;
        MyChannel.privkey = privkey;

        if (MyChannel._nodeuser == undefined) {
            MyChannel._nodeuser = await Universal({
                networkId: NETWORK_ID, url: API_URL,
                internalUrl: INTERNAL_API_URL,
                //keypair: {publicKey: this.pubkey, secretKey: this.privkey},
                keypair: {publicKey: pubkey, secretKey: privkey},
                compilerUrl: compilerURL
            });
        }
    }

    get nodeuser() {
        return MyChannel._nodeuser;
    }

    get address() {
        return MyChannel.pubkey;
    }

    constructor(init_role, public readonly opposite) {
        this.is_initiator = init_role;
        this.status = "";
    }

    get initiator() {
        return this.is_initiator ? MyChannel.pubkey : this.opposite;
    }

    get responder() {
        return this.is_initiator ? this.opposite : MyChannel.pubkey;
    }

    get role() {
        return this.is_initiator ? "initiator" : "responder";
    }

    get_options() {
        let options = {
            url: WS_URL + '/channel',
            pushAmount: 3,
            initiatorAmount: 1000000000000000,
            responderAmount: 1000000000000000,
            channelReserve: 20000000000,
            ttl: 10000,
            host: "localhost",
            port: 3001,
            lockPeriod: 1,
            initiatorId: this.initiator,
            responderId: this.responder,
            role: this.role,
        };
        console.log(1, this.initiator)
        console.log(1, this.responder)
        return options;
    }

    async initChannel() {
        const self = this;
        let options = this.get_options();

        options["sign"] = async (tag, tx) => {
            console.log("tag:", tag, tx);
            try {
                const txData = Crypto.deserialize(Crypto.decodeTx(tx), {prettyTags: true})
                console.log(JSON.stringify(txData));
            } catch (err) {
                //console.log(err);
            }
            if (tag === "shutdown_sign_ack") {
                console.log("TX:", tx)
            }
            return self.nodeuser.signTransaction(tx)
        };

        this.channel = await Channel(options);
        this.channel.on('statusChanged', (status) => {
            self.status = status.toUpperCase();
            console.log(Date.now(), `[${self.status}]`);
            console.log();
            if (self.status == "OPEN") {
                self.hb().then(console.log).catch(console.error);
                self.service.addClient(this.client);
            }
            if (self.status.startsWith("DISCONNECT")) {
                self.service.rmClient(this.client);
            }
        });
        this.channel.on('message', (msg) => {
            console.log("RECV:>", msg)
        });
        return this.channel;
    }

    async sendMessage(message) {
        //console.log("sending:"+message)
        return await this.channel.sendMessage(message, this.opposite);
    }

    async shutdown() {
        if (this.is_initiator) {
            const self = this;
            let tx = await this.channel.shutdown(_tx => self.nodeuser.signTransaction(_tx));
            return tx;
        }
    }

    async wait_state(expected) {
        const self = this;
        return await wait_for(() => self.status === expected);
    }

    async hb() {
        while (this.status == "OPEN") {
            console.log("sending hb..")
            await this.sendMessage({"type": "heartbeat"});
            await sleep(45 * 1000)
        }
    }

    // async height() {
    //     return await this.nodeuser.height();
    // }
    // async balance(opts={}) {
    //     return await this.nodeuser.balance(this.pubkey, opts);
    // }
    ///////////////////////////////////////////////////////////
    setService(s: Service) {
        this.service = s;
    }

    async init_loop() {
        //await this.init();
        await this.initChannel();
        await this.wait_state("OPEN");
    }

    abstract async loop();
}


export class CustomerChannel extends MyChannel {
    constructor(customer: CClient) {
        super(false, customer.address);
        this.client = customer;
    }
    async loop() {
        await this.init_loop();
        while (true) {
            await sleep(1000);
            await this.sendMessage( {
                from: "hub", fromId: this.address,
                to: "consumer", toId: this.client.address,
                type: "buy-request",
                id: "asdfasd-asdfasdfasdf-asdfasdf-asdf",
                something: [{"quantity": 2, "product":"beer"}],
                amount: 2*AE,
            });
        }
    }
}

export class MerchantChannel extends MyChannel {
    constructor(customer: CClient) {
        super(false, customer.address);
        this.client = customer;
    }
    async loop() {
        await this.init_loop();
        while (true) {
            await sleep(1000);
        }
    }
}
