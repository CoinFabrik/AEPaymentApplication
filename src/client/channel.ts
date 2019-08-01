import {Hub, Service} from "./client.service";
import {Actor, AE, CClient} from "./client.entity";
import {EventEmitter} from 'events';
import {Account, get_account, getEnv, sleep, wait_for} from "../tools";
import {Logger} from "@nestjs/common";
import {AppController} from "../app.controller";


const NETWORK_ID = 'ae_devnet';
const {
    Channel,
    Crypto,
    Universal
} = require('@aeternity/aepp-sdk');

const port = 3001;
let URL = '10.10.0.79:' + port;
//let URL = 'localhost:'+port;
const API_URL = "http://" + URL;
const WS_URL = "ws://" + URL;  // http is ok too
const INTERNAL_API_URL = API_URL;
const compilerURL = 'https://compiler.aepps.com';
const ACCOUNT = getEnv("ACCOUNT", "hub");


export abstract class ServerChannel extends EventEmitter {
    private static readonly xlogger = new Logger("Channel");
    is_initiator: boolean;
    channel: any;
    status: string;
    private service: Service;
    public client: CClient;

    static _nodeuser: any;
    static pubkey;
    static privkey;

    abstract Name: Actor;
    logger: Logger;
    private opposite: string;

    log(msg: string) {
        if (this.logger==undefined) {
            this.logger = new Logger(this.Name);
        }
        this.logger.log(this.opposite.slice(0,15) + "|" + msg);
    }

    static async Init() {
        let account = await Account.FromFile(ACCOUNT);
        this.xlogger.log("Account: " + account.toString());
        this.pubkey = account.publicKey;
        this.privkey = account.secretKey;

        if (ServerChannel._nodeuser == undefined) {
            ServerChannel._nodeuser = await Universal({
                networkId: NETWORK_ID, url: API_URL,
                internalUrl: INTERNAL_API_URL,
                keypair: {publicKey: this.pubkey, secretKey: this.privkey},
                compilerUrl: compilerURL
            });
        }
    }

    get nodeuser() {
        return ServerChannel._nodeuser;
    }

    get address() {
        return ServerChannel.pubkey;
    }

    static GetInfo() {
        return {address: ServerChannel.pubkey}
    }

    //protected constructor(init_role, public readonly opposite) {
    constructor(customer: CClient) {
        super();
        this.client = customer;
        this.opposite = customer.address;
        this.is_initiator = false;
        this.status = "";
        this.on("message", (msg) => {
            if (msg[info]==PING) {
            } else {
                msg[info] = JSON.parse(msg[info])
                this.hub.emit(msg[info]["type"], msg);
            }
        });
    }

    get hub(): Hub {
        return Hub.Get();
    }

    get initiator() {
        return this.is_initiator ? ServerChannel.pubkey : this.opposite;
    }

    get responder() {
        return this.is_initiator ? this.opposite : ServerChannel.pubkey;
    }

    get role() {
        return this.is_initiator ? "initiator" : "responder";
    }

    get_options() {
        let options = {
            url: WS_URL + '/channel',
            pushAmount: 3,
            initiatorAmount: 1000000000000000,
            responderAmount: 1,
            channelReserve: 1,
            ttl: 10000,
            host: "localhost",
            port: 3001,
            lockPeriod: 1,
            initiatorId: this.initiator,
            responderId: this.responder,
            role: this.role,
        };
        this.log("init:" + this.initiator)
        this.log("resp:" + this.responder)
        return options;
    }

    initChannel(s: Service) {
        this.setService(s);
        this._initChannel().then(console.log).catch(console.error);
    }
    async _initChannel() {
        const self = this;
        let options = this.get_options();

        options["sign"] = async (tag, tx) => {
            this.log("tag: " + tag + (tx.toString()));
            try {
                const txData = Crypto.deserialize(Crypto.decodeTx(tx), {prettyTags: true})
                console.log(JSON.stringify(txData));
            } catch (err) {
                //console.log(err);
            }
            if (tag === "shutdown_sign_ack") {
                this.log("TX (shutdown): " + (tx.toString()))
            }
            //console.log("Sign...")
            return await self.nodeuser.signTransaction(tx)
        };

        this.channel = await Channel(options);
        this.channel.on('statusChanged', (status) => {
            self.onStatusChange(status.toUpperCase());
        });
        this.channel.on('message', (msg) => {
            this.emit("message", msg);
        });
        await this.wait_state("OPEN");
        return this.channel;
    }

    onStatusChange(status) {
        this.status = status;
        this.log(`[${this.status}]`);
        if (this.status == "OPEN") {
            this.hb().then(console.log).catch(console.error);
            this.client.setChannel(this);
            this.service.addClient(this.client, this.Name);
        }
        if (this.status.startsWith("DISCONNECT")) {
            this.service.rmClient(this.client, this.Name);
        }
    }

    async sendMessage(message) {
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
            //this.log("sending hb..")
            await this.sendMessage({"type": "heartbeat"});
            await sleep(45 * 1000)
        }
    }

    ///////////////////////////////////////////////////////////
    setService(s: Service) {
        this.service = s;
    }
}


export class CustomerChannel extends ServerChannel {
    readonly Name: Actor = "customer";
}

const PING = "beep beep";
const info = "info";

export class MerchantChannel extends ServerChannel {
    readonly Name: Actor = "merchant";

}
