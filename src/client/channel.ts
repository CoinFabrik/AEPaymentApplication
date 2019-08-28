import {ServiceBase} from "./client.service";
import {Actor, CClient} from "./client.entity";
import {EventEmitter} from 'events';
import {Account, array_rm, clone, sleep, voidf, wait_for} from "../tools";
import {Logger} from "@nestjs/common";
import {Hub} from "./hub";
import {ACCOUNT, API_URL, INTERNAL_API_URL, MoreConfig, NETWORK_ID, WS_URL} from "../config";
import BigNumber from "bignumber.js";
import {stringify} from "querystring";
import {MerchantCustomer} from "./merchantcustomer";


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
    private opposite: string;

    protected my_pending = null;
    pending_mcs: MerchantCustomer[] = [];
    channel_state = null;
    channel_id = null;


    pendingPayment(mc: MerchantCustomer) {
        this.pending_mcs.push(mc);
    }

    checkPayment(amount: BigNumber) {
        this.pending_mcs.forEach((mc)=> {
           if (amount.isEqualTo(new BigNumber(mc.amount))) {
                mc.paymentReceived();
                array_rm(this.pending_mcs, mc);
           }
        });
    }

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
                //compilerUrl: compilerURL
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
        options["url"] = "ws"+MoreConfig.USER_NODE+'/channel';
        options["role"] = "initiator";
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
        this.client = customer;
        this.opposite = customer.address;
        this.is_initiator = false;
        this.status = "";
        const self = this;
        this.on("message", (msg) => {
            if ((msg[info]==PING)||(msg[info]==PINGACK)) {
            } else {
                try {
                    msg[info] = JSON.parse(msg[info])
                    this.hub.emit("user-"+msg[info]["type"], msg, self);
                } catch(err) {
                    console.log(err);
                    console.log("message was:")
                    console.log(msg[info]);
                }
            }
        });
    }

    get initiator() {
        return this.opposite;
    }

    static base_options() {
        return clone({
            // initiatorId: "",
            // url: WS_URL + '/channel',
            // initiatorAmount: null,
            // role: this.role,
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
        this.log("init:" + this.initiator);
        this.log("resp:" + this.responder);
        options["initiatorId"] = this.initiator;
        options["responderId"] = this.responder;
        return options;
    }

    initChannel(s: ServiceBase) {
        this._initChannel().then(voidf).catch(console.error);
    }

    async _initChannel() {
        const self = this;
        let options = this.get_options();

        if (this.channel_state!==null) {
            options["offchainTx"] = this.channel_state;
            options["existingChannelId"] = this.channel_id;
            this.channel_state = null;
        }

        this.log("opts:" + JSON.stringify(options));

        options["sign"] = async (tag, tx, { updates = {} } = {}) => {
            // tag: update_ack tx:
            // {
            //      "tag":"57","VSN":"2",
            //      "channelId":"ch_9qgsjDsjHhXvYT8hWtZYwuiCHvgFsvEBPL5tnmH9vgGRPe7PM",
            //      "round":"2",
            //      "stateHash":"st_MiomMNZwISj3zZ47c/jCfjgwgREN4r/7dYR08zZOKXSJt6yr"
            // }
            this.log("");
            this.log("tag: " + tag + " " +(tx.toString()));
            try {
                const {txType, tx: txData} = unpackTx(tx);
                this.log("tag: " + tag + ": "+ JSON.stringify(txData));
            } catch (err) {
                //console.log(err);
            }

            if (tag === "update_ack") {
                // [{
                //      "amount":1,
                //      "from":"ak_XrC9LqQ4jMj96NFkvJ1CgdSpsJTQ1MuYNB2MiavtmURYHwPd4",
                //      "op":"OffChainTransfer",
                //      "to":"ak_2TccoDkdWZ28yBYZ7QsdqBMAH5DjsVnMnZHBRyUnxPD5z1whYb"
                //  }]
                try {
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
                } catch(err) {
                    console.error(err.toString());
                    console.error("wont be signed: ", JSON.stringify(updates));
                    return
                }
            }
            if (tag === "shutdown_sign_ack") {
                const {txType, tx: txData} = unpackTx(tx);
                this.log("tag: " + tag + ": "+ JSON.stringify(txData));
                this.log("TX (shutdown): " + (tx.toString()))
            }
            this.log("");
            let x = await self.nodeuser.signTransaction(tx)
            setTimeout(() => {self.saveState();}, 300)
            return x;
        };

        this.channel = await Channel(options);
        this.channel_id = this.channel.id();

        this.channel.on('statusChanged', (status) => {
            self.onStatusChange(status.toUpperCase());
        });
        this.channel.on('error', (error) => {
            console.log("ERRRORRRRR:", error);
        });
        this.channel.on('message', (msg) => {
            this.emit("message", msg);
        });
        await this.wait_state("OPEN");
        return this.channel;
    }

    saveState() {
        const self = this;
        this.channel.state()
            .then((s)=> {
                let state = s["signedTx"];
                if (state===self.channel_state) {
                    setTimeout(() => {self.saveState();}, 300)
                } else {
                    console.log("STATE:", JSON.stringify(s))
                    self.channel_state = state;
                }
            })
            .catch(err => console.error("cant get state:"+err));
    }

    onStatusChange(status) {
        this.status = status;
        this.log(`[${this.status}]`);
        if (this.status == "OPEN") {
            this.hb().then(console.log).catch(console.error);
            this.client.setChannel(this);
            ServiceBase.addClient(this.client, this.Name);
        }
        if (this.status.startsWith("DISCONNECT")) {
            ServiceBase.rmClient(this.client, this.Name);
            this._initChannel().then(voidf).catch(err=>console.error("Cannot re init channel:"+err))
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
            await this.sendMessage({"type": "heartbeat"});
            await sleep(45 * 1000)
        }
    }

    ///////////////////////////////////////////////////////////
    async update(_from, _to, amount) {
        const self = this;
        try {
            let result = await this.channel.update(_from, _to, amount, async (tx) => {
                console.log("signing: ", tx.toString())
                return await self.nodeuser.signTransaction(tx);
            });
            return result;
        } catch(err) {
            console.log("---------------------------------------------------")
            console.log("Error on update:", err);
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

    async sendTxRequest(amount) {
        return await this.update(this.initiator, this.address, amount);
    }

    // async sign_n_send(tx) {
    //     console.log("1signing: ", tx.toString())
    //     let ttx = await this.nodeuser.signTransaction(tx);
    //     let sent = await this.sendMessage({"type":"signnsend", "tx":ttx})
    //     await wait_for(() => {return this.my_pending!==null});
    //     let x = this.my_pending;
    //     this.my_pending = null;
    //     return x;
    // }
    //
    //
    // async custom_update(_from, _to, amount) {
    //     const self = this;
    //     try {
    //         let result = await this.channel.update(_from, _to, amount, async (tx) => {
    //             console.log("signing: ", tx.toString())
    //             //return await self.nodeuser.signTransaction(tx);
    //             return await this.sign_n_send(tx)
    //         });
    //         return result;
    //     } catch(err) {
    //         console.log("---------------------------------------------------")
    //         console.log("Error on update:", err);
    //         return null
    //     }
    // }
}

const PING = "beep beep";
const PINGACK = "heartbeat-ack";
const info = "info";

export class MerchantChannel extends ServerChannel {
    readonly Name: Actor = "merchant";
}
