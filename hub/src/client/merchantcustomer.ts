import {CClient, InvalidCustomer, InvalidMerchant, InvalidRequest} from './client.entity';
import {clone, sleep, voidf} from '../tools';
import {ClientService, RepoService} from './client.service';
import {Hub} from './hub';
import BigNumber from 'bignumber.js';
import {Pending, ServerChannel} from './channel';
import {MerchantCustomerAccepted} from './mca.entity';

export class Guid {
  static generate() {
    return 'xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

enum PaymentState {
    Waiting,
    Received,
    Canceled,
}

export class MerchantCustomer {
    readonly id: string;
    static all: { [key: string]: MerchantCustomer } = {};
    readonly original_msg: object;
    readonly _base: object;
    state: PaymentState = PaymentState.Waiting;
    public pending: Pending;

    static register(mc: MerchantCustomer) {
        this.all[mc.id] = mc;
    }

    static ValidId(id: string): boolean {
        return this.all[id] == undefined;
    }

    static Get(mc_id): MerchantCustomer {
        return this.all[mc_id];
    }

    private constructor(readonly merchant: string, readonly customer: string, public msg: object) {
        let id;
        try {
            id = msg['info']['id'];
            if (!MerchantCustomer.ValidId(id)) {
                    throw new InvalidRequest('Invalid id:' + id);
            }
        }	catch (err) {
            id = Guid.generate();
            Hub.Get().log('generating new id: ' + id);
        }
        this.id = id;
        MerchantCustomer.register(this);

        if (typeof msg['info']['amount'] === 'number') {
            console.error('!!!!  WE RECEIVED A NUMBER: ' + (msg['info']['amount'].toString()) );
            console.error('!!!!  AT: ' + JSON.stringify(msg));
        }
        this.original_msg = msg;
        this.original_msg['info']['amount'] = new BigNumber(msg['info']['amount']).toString(10);
        this._base = {
            id: this.id,
            merchant: this.merchant,
            merchant_name: this.mclient.name,
            customer: this.customer,
            amount: this.original_msg['info']['amount'],  // we ensure this is a string
            something: this.original_msg['info']['something'],
        };
    }

    getEntity(): MerchantCustomerAccepted {
        return MerchantCustomerAccepted.Create(this.merchant, this.customer,
            this.id, this.amount_str,  // XXX
            this.original_msg['info']['something']);
    }

    get amount(): BigNumber {
        return new BigNumber(this.original_msg['info']['amount']);
    }

    get amount_str(): string {
        return this.amount.toString(10);
    }

    base(): object {
        return clone(this._base);
    }

    static errorMsg(err: Error, msg: any): object {
        const base = clone(msg);
        base['type'] = 'error';
        base['msg'] = err.toString;
        return base;
    }

    static paymentRejected(err: Error, msg: any): object {
        const base = clone(msg);
        base['type'] = 'payment-request-rejected';
        base['msg'] = err.toString();
        return base;
    }

    msgPaymentAccepted(): object {
        const base = this.base();
        base['type'] = 'payment-request-accepted';
        return base;
    }

    msgPaymentRequestCompleted() {
        const base = this.base();
        let name = this.customer;
        try {
            name = this.cclient.name;
        } catch (err) {
            // if no client, ignore name..
        }
        base['customer_name'] = name;
        base['type'] = 'payment-request-completed';
        return base;
    }

    msgPaymentRequestCanceled() {
        const base = this.base();
        base['type'] = 'payment-request-canceled';
        return base;
    }

    sendCustomer(msg: object) {
        try {
            this.cclient.channel.sendMessage(msg).then(voidf).catch(console.error);
        } catch (err) {
            console.log(' * customer disappeared: ' + this.customer + 'message not delivered!');
        }
    }

    sendMerchant(msg: object) {
        try {
            this.mclient.channel.sendMessage(msg).then(voidf).catch(console.error);
        } catch (err) {
            console.log(' * merchant disappeared: ' + this.merchant + 'message not delivered!');
        }
    }

    public get mclient(): CClient {
        return ClientService.getClientByAddress(this.merchant, 'merchant');
    }

    public get cclient(): CClient {
        return ClientService.getClientByAddress(this.customer, 'customer');
    }

    static FromRequest(msg: object): MerchantCustomer {
        const merchant = msg['info']['merchant'];
        if (null == ClientService.getClientByAddress(merchant, 'merchant')) {
            throw new InvalidMerchant(merchant);
        }
        const customer = msg['info']['customer'];
        if (null == ClientService.getClientByAddress(customer, 'customer')) {
            throw new InvalidCustomer(customer);
        }
        return new MerchantCustomer(merchant, customer, msg);
    }

    paymentReceived() {
        if (this.state !== PaymentState.Waiting) {
            return;
        }
        this.paymentAccepted().then(voidf).catch(console.error);
    }

    paymentTimedout() {
        if (this.state !== PaymentState.Waiting) {
            return;
        }
        this.state = PaymentState.Canceled;
        Hub.Get().emit('payment-request-canceled', this);
    }

    async paymentAccepted() {
        this.state = PaymentState.Received;
        Hub.Get().emit('payment-request-completed', this);
        while (1) {
            try {
                const mca = this.getEntity();
                await RepoService.save(mca);
                return;
            } catch (err) {
                console.log(err);
                await sleep(300);
            }
        }
    }

    reject(): boolean {
        if (this.pending) {
            const pending = this.pending;
            this.pending = null;
            pending.reject();
            return true;
        }
        return false;
    }
}
