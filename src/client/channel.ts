import {RepoService, ServiceBase} from "./client.service";
import {Actor, CClient} from "./client.entity";
import {EventEmitter} from 'events';
import {Account, array_rm, clone, sleep, voidf, wait_for} from "../tools";
import {Logger} from "@nestjs/common";
import {Hub} from "./hub";
import {ACCOUNT, API_URL, INTERNAL_API_URL, MoreConfig, NETWORK_ID, WS_URL} from "../config";
import BigNumber from "bignumber.js";
import {stringify} from "querystring";
import {MerchantCustomer} from "./merchantcustomer";
import {MerchantCustomerAccepted} from "./mca.entity";


const {
    Channel,
    Crypto,
    Universal,
    TxBuilder: {unpackTx}
} = require('@aeternity/aepp-sdk');


export interface UpdateItem {
    amount: number | BigNumber;
    from: string;
    to: string;
    op: string;
}


export class InvalidUpdateOperation extends Error {
    constructor(update: UpdateItem) {
        super("Invalid Update: operation: " + update.op );
    }
}
export class InvalidUpdateWrongFrom extends Error {
    constructor(update: UpdateItem) {
        super("Invalid Update: wrong from: " + update.from );
    }
}
export class InvalidUpdateWrongTo extends Error {
    constructor(update: UpdateItem) {
        super("Invalid Update: wrong to: " + update.to );
    }
}
export class InvalidUpdateNegativeAmount extends Error {
    constructor(update: UpdateItem) {
        super("Invalid Update: negative amount " + update.amount );
    }
}

const PING = "beep beep";
const PINGACK = "heartbeat_ack";
const info = "info";

const RECONNECT = true;

export abstract class ServerChannel extends EventEmitter {
    private static readonly xlogger = new Logger("Channel");
    is_initiator: boolean;
    channel: any;
    status: string;
    private service: ServiceBase;
    public client: CClient;

    static _nodeuser: any;
    static pubkey;
    static privkey;

    abstract Name: Actor;
    logger: Logger;
    readonly opposite: string;
    private last_update: number;
    private last_ping: number = null;
    private disconnect_by_leave = false;
    pending_mcs: MerchantCustomer[] = [];
    private closing = false;


    pendingPayment(mc: MerchantCustomer) {
        this.pending_mcs.push(mc);
    }

    checkPayment(amount: BigNumber) {
        this.pending_mcs.forEach((mc)=> {
           if (amount.isEqualTo(mc.amount)) {
                mc.paymentReceived();
                array_rm(this.pending_mcs, mc);
           }
        });
    }

    log(msg: string) {
        if (this.logger==undefined) {
            this.logger = new Logger(this.Name);
        }
        let nomi = this.client.channelId ? this.client.channelId : this.opposite;
        this.logger.log(nomi.slice(0,15) + "|" + msg);
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
            });
        }

        let balance = await this.nodeuser.balance(ServerChannel.pubkey);
        this.xlogger.log(`Server: ${this.responder} balance: ${balance}`);
    }

    static get nodeuser() {
        return ServerChannel._nodeuser;
    }

    static get address() {
        return ServerChannel.pubkey;
    }

    static GetInfo(client: CClient) {
        let options = this.base_options();
        options["initiatorId"] = client.address;
        options["initiatorAmount"] = client.amount;
        options["url"] = "ws"+MoreConfig.USER_NODE+'/channel';  // XXX XXX TODO
        options["role"] = "initiator";
        if (RECONNECT) {
            client.setChannelOptions(options);
        }
        this.xlogger.log("client:"+ JSON.stringify(options));
        return {
            address: this.address,
            node: MoreConfig.USER_NODE,
            options: options,
        }
    }

    static GetNameInfo() {
        return {
            address: this.address,
            node: MoreConfig.USER_NODE,
        }
    }

    static get responder() {
        return this.address;
    }

    static get role(): "responder"|"initiator" {
        return "responder";
    }

    get responder() {
        return ServerChannel.responder;
    }

    get role() {
        return ServerChannel.role;
    }

    get nodeuser() {
        return ServerChannel.nodeuser;
    }

    get address() {
        return ServerChannel.address;
    }

    async hub_balance() {
        let data = await this.channel.balances([this.address])
        return new BigNumber((data)[this.address]);
    }

    get hub(): Hub {
        return Hub.Get();
    }

    constructor(customer: CClient) {
        super();
        this.last_update = Date.now();
        this.client = customer;
        this.opposite = customer.address;
        this.is_initiator = false;
        this.status = "";
        const self = this;
        this.on("message", (msg) => {
            if ((msg[info]==PING)||(msg[info]==PINGACK)) {
                this.last_ping = Date.now();
            } else if (msg[info]==="leave") {
                this.leave("from client");
            } else {
                this.last_update = Date.now();
                try {
                    msg[info] = JSON.parse(msg[info]);
                    if(msg[info]["type"]==="payment-user-cancel") {
                        return this.update_clash();
                    }
                    this.hub.emit("user-"+msg[info]["type"], msg, self);
                } catch(err) {
                    this.log(err);
                    this.log("message was:")
                    this.log(msg[info]);
                }
            }
        });
    }

    update_clash() {
        this.update(this.opposite, this.address, 1, "triggering update conflict.")
            .then((result)=> this.log("clash-update()= "  + result + JSON.stringify(result)))
            .catch((err)=>{ this.log("update clash failed: "+err)});
    }

    get initiator() {
        return this.opposite;
    }

    static base_options() {
        return clone({
            // initiatorId / initiatorAmount / role / url: WS_URL + '/channel',
            responderId: this.address,
            pushAmount: 0,
            responderAmount: 1,
            channelReserve: 1,
            host: "localhost",
            port: 3001,
            lockPeriod: 1,
        });
    }

    get_options() {
        let options = ServerChannel.base_options();
        options["url"] = WS_URL + '/channel';
        options["initiatorAmount"] = this.client.amount;
        options["role"] = this.role;
        options["initiatorId"] = this.initiator;
        this.log("init:" + this.initiator);
        this.log("resp:" + this.responder);
        return options;
    }

    initChannel() {
        this._initChannel().then(voidf).catch(console.error);
    }

    async customSign(tag, tx, { updates = {} } = {}) {
        this.log("");
        this.log("tag: " + tag + " " +(tx.toString()));
        try {
            const {txType, tx: txData} = unpackTx(tx);
            this.log("tag: " + tag + ": "+ JSON.stringify(txData));
        } catch (err) {
        }
        if (tag === "update_ack") {
            let fupdates: UpdateItem[] = updates as UpdateItem[];
            for (let update of fupdates) {
                if (update["op"]!=="OffChainTransfer") {
                    throw new InvalidUpdateOperation(update);
                }
                if (update["from"]!==this.initiator) {
                    throw new InvalidUpdateWrongFrom(update);
                }
                if (update["to"]!==this.address) {
                    throw new InvalidUpdateWrongTo(update);
                }
                if ((new BigNumber(update["amount"])).isNegative()) {
                    throw new InvalidUpdateNegativeAmount(update);
                }
            }
        }
        if (tag === "shutdown_sign_ack") {
            const {txType, tx: txData} = unpackTx(tx);
            this.log("tag: " + tag + ": "+ JSON.stringify(txData));
            this.log("TX (shutdown): " + (tx.toString()))
            this.closing = true;
        }
        let signed = await this.nodeuser.signTransaction(tx);
        this.log(tag+ " - signed: "+ signed);
        return signed;
    }

    async _initChannel() {
        let options = this.get_options();
        if (RECONNECT) {
            this.client.setChannelOptions(options);
        }
        this.log("opts:" + JSON.stringify(options));
        options["sign"] = async (tag, tx, { updates = {} } = {}) => {
            try {
                let result = await this.customSign(tag, tx, { updates });
                this.saveState();
                return result;
            } catch (err) {
                console.error(err);
                console.error("wont be signed!");
                throw err;
            }
        };

        this.channel = await Channel(options);
        this.channel.on('statusChanged', (status) => {
            this.onStatusChange(status.toUpperCase());
        });
        this.channel.on('error', (error) => {
            this.log("channel-error: "+ error);
        });
        this.channel.on('message', (msg) => {
            this.emit("message", msg);
        });

        await this.wait_state("OPEN");
        if (!this.client.isReestablish(options)) {
            const mca = MerchantCustomerAccepted.CreateInitialDeposit(options, this.Name);
            await RepoService.save(mca);
        }
        this.client.channelId = this.channel.id();
        this.saveState();
        return this.channel;
    }

    saveState(delay=100) {
        setTimeout(() => {this._saveState(5);}, delay);
    }

    _save_state(s) {
        if (this.status!=="OPEN")
            return this.log("saving status: channel isn't open anymore!!!");
        if (s==null) {
            if ((this.client.channelId==null) && (this.client.channelSt==null))
                return this.log("saving status: unchanged");
            this.client.channelId = null;
            this.client.channelSt = null;
            this.log("removing saved state!");
        } else {
            let state = s["signedTx"];
            if (state===this.client.channelSt)
                return this.log("saving status: unchanged");
            this.client.channelSt = state;
            this.log("client Saving...: "  + state);
        }
        return this.client.save();
    }

    _saveState(retries) {
        this.log("Saving state...");
        this.channel.state()
            .then((s)=> {
                let state = s["signedTx"];
                if (state===this.client.channelSt) {
                    if (retries>0) {
                        setTimeout(() => {this._saveState(retries-1);}, 100)
                    }
                } else {
                    this.log("STATE: " + JSON.stringify(s));
                    return this._save_state(s)
                }
            })
            .catch(err => {
                console.error("cant get state:");
                console.error(err);
            });
    }

    onStatusChange(status) {
        this.last_update = Date.now();
        this.status = status;
        this.log(`[${this.status}]`);
        if (this.status == "OPEN") {
            this.hb().then(voidf).catch(console.error);
            this.client.setChannel(this);
            ServiceBase.addClient(this.client, this.Name);
        }
        if (this.status.startsWith("DISCONNECT")) {
            ServiceBase.rmClient(this.client, this.Name);
            console.log("STATE AT DISCONNECT:", JSON.stringify(this.channel.state));
            if (!this.disconnect_by_leave) {
                this._save_state(null);
            }
        }
    }

    async sendMessage(message) {
        return await this.channel.sendMessage(message, this.opposite);
    }

    async shutdown() {
        if (this.is_initiator) {
            const self = this;
            return await this.channel.shutdown(_tx => self.nodeuser.signTransaction(_tx));
        }
    }

    async wait_state(expected) {
        const self = this;
        return await wait_for(() => self.status === expected);
    }

    is_customer():boolean {
        return this.Name === "customer";
    }

    async hb() {
        while (this.status == "OPEN") {
            await this.sendMessage({"type": "heartbeat"});
            await sleep(1 * 1000)
            if (this.is_customer() && (Date.now()-this.last_update>900*1000)) {
                break
            }
        }
        if (this.status == "OPEN") {
            this.leave("after HB");
        }
    }

    leave(cause: string) {
        if (!this.disconnect_by_leave) {
            this.log("Issuing leave("+cause+")..");
            this.disconnect_by_leave = true;
            this.channel.leave()
                .then( (state) => this._save_state(state))
                .catch( (err) => console.error("Cannot leave:"+err));
        }
    }

    ///////////////////////////////////////////////////////////
    async update(_from, _to, amount, msg="") {
        const self = this;
        try {
            let result = await this.channel.update(_from, _to, amount, async (tx) => {
                this.log("signing: " +  tx.toString()  +  JSON.stringify(msg))
                return await self.nodeuser.signTransaction(tx);
            });
            return result;
        } catch(err) {
            this.log("Error on update: " + err);
            return null
        }
    }

    async withdraw(amount) {
        return await this.channel.withdraw(amount, (tx) => {
            this.log(`withdraw sign: ${tx}`);
            return this.nodeuser.signTransaction(tx);
        });
    }

    async deposit(amount) {
        return await this.channel.deposit(amount, (tx) => {
            this.log(`deposit sign: ${tx}`);
            return this.nodeuser.signTransaction(tx);
        });
    }
}


export class CustomerChannel extends ServerChannel {
    readonly Name: Actor = "customer";
}


export class MerchantChannel extends ServerChannel {
    readonly Name: Actor = "merchant";
}
