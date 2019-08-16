import {CClient, InvalidCustomer, InvalidMerchant, InvalidRequest, MerchantCustomerAccepted} from "./client.entity";
import {clone, voidf} from "../tools";
import {ClientService} from "./client.service";

export class Guid {
  static generate() {
    return 'xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}


export class MerchantCustomer {
    readonly id: string;
    static all: { [key: string]: MerchantCustomer } = {};
    readonly original_msg: object;
    readonly _base: object;

    static register(mc: MerchantCustomer) {
        this.all[mc.id] = mc;
    }

    static ValidId(id: string): boolean {
        return this.all[id] == undefined;
    }

    private constructor(readonly merchant: string, readonly customer: string, public msg: object,
                        id?: string, private _mclient?: CClient, private _cclient?: CClient) {
        if (id != undefined) {
            if (!MerchantCustomer.ValidId(id)) {
                throw new InvalidRequest("Invalid id:" + id);
            }
        } else {
            id = Guid.generate();
        }
        this.id = id;
        MerchantCustomer.register(this);

        this.original_msg = msg;
        this._base = {
            "id": this.id,
            "merchant": this.merchant,
            "merchant_name": this.mclient.name,
            "customer": this.customer,
            "amount": this.original_msg["info"]["amount"],
            "something": this.original_msg["info"]["something"],
        }
    }

    getEntity(): MerchantCustomerAccepted {
        return MerchantCustomerAccepted.Create(this.merchant, this.customer,
            this.id, this.amount.toString(),  // XXX
            this.original_msg["info"]["something"]);
    }

    get amount(): number {
        return this.original_msg["info"]["amount"];
    }

    get amount_str(): string {
        return this.amount.toString();
    }

    base(): object {
        return clone(this._base);
    }

    static errorMsg(err: Error, msg: any): object {
        let base = clone(msg);
        base["type"] = "error";
        base["msg"] = err.toString;
        return base;
    }

    static paymentRejected(err: Error, msg: any): object {
        let base = clone(msg);
        base["type"] = "payment-request-rejected";
        base["msg"] = err.toString();
        return base;
    }

    msgPaymentAccepted(): object {
        let base = this.base();
        base["type"] = "payment-request-accepted";
        return base;
    }

    msgPaymentRequestCompleted() {
        let base = this.base();
        base["type"] = "payment-request-completed";
        return base;
    }

    msgPaymentRequestCanceled() {
        let base = this.base();
        base["type"] = "payment-request-canceled";
        return base;
    }

    sendCustomer(msg: object) {
        this.cclient.channel.sendMessage(msg).then(voidf).catch(console.error);
    }

    sendMerchant(msg: object) {
        this.mclient.channel.sendMessage(msg).then(voidf).catch(console.error);
    }

    public get mclient(): CClient {
        if (this._mclient == null) {
            this._mclient = ClientService.getClientByAddress(this.merchant, "merchant");
        }
        return this._mclient;
    }

    public get cclient(): CClient {
        if (this._cclient == null) {
            this._cclient = ClientService.getClientByAddress(this.customer, "customer");
        }
        return this._cclient;
    }

    // static FromMerchantRequest(msg: object): MerchantCustomer {
    //     let merchant = msg["from"];
    //     let mclient = ClientService.getClientByAddress(merchant, "merchant");
    //     if (mclient == null) {
    //         throw new InvalidMerchant(merchant)
    //     }
    //     let customer = msg["info"]["toId"];
    //     let cclient = ClientService.getClientByAddress(customer, "customer");
    //     if (cclient == null) {
    //         throw new InvalidCustomer(customer);
    //     }
    //     return new MerchantCustomer(merchant, customer, msg);
    // }

    static FromRequest(msg: object): MerchantCustomer {
        let merchant = msg["info"]["merchant"];
        let mclient = ClientService.getClientByAddress(merchant, "merchant");
        if (mclient == null) {
            throw new InvalidMerchant(merchant)
        }
        let customer = msg["info"]["customer"];
        let cclient = ClientService.getClientByAddress(customer, "customer");
        if (cclient == null) {
            throw new InvalidCustomer(customer);
        }
        return new MerchantCustomer(merchant, customer, msg, msg["id"]);
    }
}