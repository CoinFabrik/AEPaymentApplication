/* tslint:disable:no-console no-string-literal */
import {RepoService, ServiceBase} from './client.service';
import {Actor, CClient} from './client.entity';
import {EventEmitter} from 'events';
import {Account, array_rm, clone, sleep, voidf, wait_for} from '../tools';
import {Logger} from '@nestjs/common';
import {Hub} from './hub';
import {ACCOUNT, API_URL, MoreConfig, WS_URL} from '../config';
import BigNumber from 'bignumber.js';
import {MerchantCustomer} from './merchantcustomer';
import {MerchantCustomerAccepted} from './mca.entity';

const {
    Channel,
    Crypto,
    Universal,
    TxBuilder: {unpackTx, buildTxHash}
} = require('@aeternity/aepp-sdk');


function max(a, b: number): number {
    if (a > b) {
        return a;
    }
    return b;
}

export interface UpdateItem {
    amount: number | BigNumber;
    from: string;
    to: string;
    op: string;
}

export class InvalidUpdateOperation extends Error {
    constructor(update: UpdateItem) {
        super('Invalid Update: operation: ' + update.op);
    }
}

export class InvalidUpdateWrongFrom extends Error {
    constructor(update: UpdateItem) {
        super('Invalid Update: wrong from: ' + update.from);
    }
}

export class InvalidUpdateWrongTo extends Error {
    constructor(update: UpdateItem) {
        super('Invalid Update: wrong to: ' + update.to);
    }
}

export class InvalidUpdateNegativeAmount extends Error {
    constructor(update: UpdateItem) {
        super('Invalid Update: negative amount ' + update.amount);
    }
}

const PING = 'beep beep';
const PINGACK = 'heartbeat_ack';
const info = 'info';

const RECONNECT = true;

export interface Pending {
    mc: MerchantCustomer,
    resolve: any,
    reject: any,
    timeout: any,
}

export abstract class ServerChannel extends EventEmitter {
    private static readonly xlogger = new Logger('Channel');
    is_initiator: boolean;
    channel: any;
    status: string;
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
    private pending_mcs: Pending[] = [];
    private closing = false;
    private died = false;

    log(msg: string) {
        if (this.logger == undefined) {
            this.logger = new Logger(this.Name);
        }
        let nomi = this.client.channelId ? this.client.channelId : this.opposite;
        this.logger.log(nomi.slice(0, 15) + '|' + msg);
    }

    static async Init() {
        const account = await Account.FromFile(ACCOUNT);
        this.xlogger.log('Account: ' + account.toString());
        this.pubkey = account.publicKey;
        this.privkey = account.secretKey;

        if (ServerChannel._nodeuser == undefined) {
            ServerChannel._nodeuser = await Universal({
                networkId: MoreConfig.NetworkId,
                url: API_URL,
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
        options['initiatorId'] = client.address;
        options['initiatorAmount'] = client.amount;
        options['url'] = 'ws' + MoreConfig.USER_NODE + '/channel';  // XXX XXX TODO
        options['role'] = 'initiator';
        if (RECONNECT) {
            client.setChannelOptions(options);
        }
        this.xlogger.log('client:' + JSON.stringify(options));
        return {
            address: this.address,
            node: MoreConfig.USER_NODE,
            options: options,
        };
    }

    static GetNameInfo() {
        return {
            address: this.address,
            node: MoreConfig.USER_NODE,
        };
    }

    static get responder() {
        return this.address;
    }

    static get role(): 'responder' | 'initiator' {
        return 'responder';
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
        let data = await this.channel.balances([this.address]);
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
        this.status = '';
        const self = this;
        this.on('message', (msg) => {
            if ((msg[info] == PING) || (msg[info] == PINGACK)) {
                this.last_ping = Date.now();
            } else if (msg[info] === 'leave') {
                this.leave('from client');
            } else {
                this.last_update = Date.now();
                try {
                    msg[info] = JSON.parse(msg[info]);
                    // if(msg[info]["type"]==="payment-user-cancel") {
                    //     return this.update_clash();
                    // }
                    this.hub.emit('user-' + msg[info]['type'], msg, self);
                } catch (err) {
                    this.log(err);
                    this.log('message was:');
                    this.log(msg[info]);
                }
            }
        });
    }

    update_clash() {
        let msg = 'triggering update conflict.';
        this.log(msg);
        this.update(this.opposite, this.address, 1, msg)
            .then((result) => this.log('clash-update()= ' + result + JSON.stringify(result)))
            .catch((err) => {
                this.log('update clash failed: ' + err);
            });
    }

    get initiator() {
        return this.opposite;
    }

    static base_options() {
        const timeout = 3 * 1000 * 60 * 3 * max(MoreConfig.MinimumDepth, 1);
        return clone({ // initiatorId / initiatorAmount / role / url: WS_URL + '/channel',
            responderId: this.address,
            pushAmount: 0,
            responderAmount: 1,
            channelReserve: 1,
            host: 'localhost',
            port: 3001,
            lockPeriod: 1,
            minimum_depth: MoreConfig.MinimumDepth,
            timeoutFundingLock: timeout,
        });
    }

    get_options() {
        let options = ServerChannel.base_options();
        options['url'] = WS_URL + '/channel';
        options['initiatorAmount'] = this.client.amount;
        options['role'] = this.role;
        options['initiatorId'] = this.initiator;
        this.log('init:' + this.initiator);
        this.log('resp:' + this.responder);
        return options;
    }

    initChannel() {
        this._initChannel().then(voidf).catch(console.error);
    }

    async customSign(tag, tx, {updates = {}} = {}) {
        this.log('');
        this.log('tag: ' + tag + ' ' + (tx.toString()));
        try {
            const {txType, tx: txData} = unpackTx(tx);
            this.log('tag: ' + tag + '/' + txData['round'] + ': ' + JSON.stringify(txData));
        } catch (err) {
        }
        if (tag === 'update_ack') {
            let fupdates: UpdateItem[] = updates as UpdateItem[];
            for (let update of fupdates) {
                if (update['op'] !== 'OffChainTransfer') {
                    throw new InvalidUpdateOperation(update);
                }
                if (update['from'] !== this.initiator) {
                    throw new InvalidUpdateWrongFrom(update);
                }
                if (update['to'] !== this.address) {
                    throw new InvalidUpdateWrongTo(update);
                }
                if ((new BigNumber(update['amount'])).isNegative()) {
                    throw new InvalidUpdateNegativeAmount(update);
                }
                for (let pending of this.pending_mcs) {
                    if (pending.mc.amount.isEqualTo(new BigNumber(update['amount']))) {
                        pending.resolve();
                    }
                }
            }
        }
        if (tag === 'shutdown_sign_ack') {
            const {txType, tx: txData} = unpackTx(tx);
            this.log('tag: ' + tag + ': ' + JSON.stringify(txData));
            this.log('TX (shutdown): ' + (tx.toString()));
            this.closing = true;
        }
        const signed = await this.nodeuser.signTransaction(tx);
        let txhash = '';
        try {
            txhash = buildTxHash(signed);
        } catch (err) {
            // do no thing.
        }
        this.log(tag + ' # ' + txhash + ' -signed: ' + signed);
        return signed;
    }

    async _initChannel() {
        let options = this.get_options();
        if (RECONNECT) {
            this.client.setChannelOptions(options);
        }
        this.log('opts:' + JSON.stringify(options));
        options['sign'] = async (tag, tx, {updates = {}} = {}) => {
            try {
                let result = await this.customSign(tag, tx, {updates});
                // this.saveState();
                return result;
            } catch (err) {
                console.error(err);
                console.error('wont be signed!');
                throw err;
            }
        };

        this.channel = await Channel(options);
        this.channel.on('statusChanged', (status) => {
            this.onStatusChange(status.toUpperCase());
        });
        this.channel.on('error', (error) => {
            this.log('channel-error: ' + error);
        });
        this.channel.on('message', (msg) => {
            this.emit('message', msg);
        });
        this.channel.on('stateChanged', (state) => {
            this.saveState().then(voidf).catch((err => {
                this.log(err);
            }));
        });

        await this.wait_state('OPEN');
        if (!this.client.isReestablish(options)) {
            const mca = MerchantCustomerAccepted.CreateInitialDeposit(options, this.Name);
            await RepoService.save(mca);
        }
        this.client.channelId = this.channel.id();
        return this.channel;
    }

    _save_state() {
        return this.client.save();
    }

    onStatusChange(status) {
        this.last_update = Date.now();
        this.status = status;
        this.log(`[${this.status}]`);
        if (this.status === 'OPEN') {
            this.hb().then(voidf).catch(console.error);
            this.client.setChannel(this);
            ServiceBase.addClient(this.client, this.Name);
        }
        if (this.status.startsWith('DIED')) {
            this.died = true;
        }
        if (this.status.startsWith('DISCONNECT')) {
            ServiceBase.rmClient(this.client, this.Name);
            if ((!this.disconnect_by_leave) && !(this.died) || this.closing) {
                this._reset_state().then(() => {
                    this._save_state();
                })
                    .catch(console.error);
            }
        }
    }

    async _reset_state() {
        this.client.channelId = '';
        this.client.channelSt = '';
        this.client.channelPoi = '';
        this.client.iBalance = '0';
        this.client.rBalance = '0';
    }

    async sendMessage(message) {
        return await this.channel.sendMessage(message, this.opposite);
    }

    async shutdown() {
        if (this.is_initiator) {
            const self = this;
            return await this.channel.shutdown(tx => self.nodeuser.signTransaction(tx));
        }
    }

    async wait_state(expected) {
        const self = this;
        return await wait_for(() => self.status === expected);
    }

    is_customer(): boolean {
        return this.Name === 'customer';
    }

    async hb() {
        while (this.status === 'OPEN') {
            await this.sendMessage({type: 'heartbeat'});
            await sleep(40 * 1000);
            if (this.is_customer() && (Date.now() - this.last_update > 90000 * 1000)) {
                break;
            }
        }
        if (this.status === 'OPEN') {
            this.leave('after HB');
        }
    }

    leave(cause: string) {
        if (!this.disconnect_by_leave) {
            this.log('Issuing leave(' + cause + ')..');
            this.disconnect_by_leave = true;
            this.a_leave().then(voidf).catch(err => this.log(err));
        }
    }

    async _get_state(leave = false) {
        const balances = await this.channel.balances([this.initiator, this.responder]);
        this.client.iBalance = (new BigNumber(balances[this.initiator])).toString(10);
        this.client.rBalance = (new BigNumber(balances[this.responder])).toString(10);
        this.client.channelId = this.channel.id();
        const poi = await this.channel.poi({
            accounts: [this.address, this.opposite],
        });
        this.client.channelPoi = JSON.stringify(poi);
        const state = leave ? await this.channel.leave() : await this.channel.state();
        this.client.channelSt = state['signedTx'];
    }

    async saveState(leave = false) {
        await this._get_state(leave);
        this._save_state();
    }

    async a_leave() {
        try {
            await this.saveState(true);
        } catch (err) {
            this.log('Cannot leave:' + err);
        }
    }

    async solo() {
        const poi = JSON.parse(this.client.channelPoi);
        const closeSoloTxFee = await this.nodeuser.channelCloseSoloTx({
            channelId: this.client.channelId,
            fromId: this.address,
            poi,
            payload: this.client.channelSt});
        console.log('R1:', JSON.stringify(await this.signAndSend(closeSoloTxFee)));

        const r2 = await this.nodeuser.channelSettleTx({
            channelId: this.client.channelId,
            fromId: this.address,
            initiatorAmountFinal: this.client.iBalance,
            responderAmountFinal: this.client.rBalance,
        });
        console.log('R2:', JSON.stringify(await this.signAndSend(r2)));
    }

    async signAndSend(tx) {
        const fee = unpackTx(tx).tx.fee;
        const signed = await this.nodeuser.signTransaction(tx);
        const result = await this.nodeuser.sendTransaction(signed, {waitMined: true});
        return {result, fee};
    }

    ///////////////////////////////////////////////////////////
    async update(from, to, amount, msg = '') {
        const self = this;
        try {
            const result = await this.channel.update(from, to, amount, async (tx) => {
                this.log('signing: ' + tx.toString() + JSON.stringify(msg));
                return await self.nodeuser.signTransaction(tx);
            });
            return result;
        } catch (err) {
            this.log('Error on update: ' + err);
            return null;
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

    async pendingPayment(mc: MerchantCustomer, cb, timeout_ms) {
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(reject, timeout_ms);
            let pending = {
                mc, resolve: () => {
                    clearTimeout(timeout);
                    try {
                        cb();
                    } finally {
                        resolve();
                    }
                }, reject, timeout
            };
            mc.pending = pending;
            this.pending_mcs.push(pending);
        });
    }

    private removePending(mc: MerchantCustomer) {
        let pending = mc.pending;
        mc.pending = null;
        try {
            clearTimeout(pending.timeout);
        } catch (err) {
        }
        array_rm(this.pending_mcs, pending);
    }
}

export class CustomerChannel extends ServerChannel {
    readonly Name: Actor = 'customer';
}

export class MerchantChannel extends ServerChannel {
    readonly Name: Actor = 'merchant';
}
