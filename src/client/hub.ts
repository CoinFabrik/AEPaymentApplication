import {EventEmitter} from "events";
import {Logger} from "@nestjs/common";
import {mystringify, sleep, voidf} from "../tools";
import {PaymentTimeout} from "./client.entity";
import {ClientService, RepoService} from "./client.service";
import {MerchantCustomer} from "./merchantcustomer";
import BigNumber from "bignumber.js";


const WAIT_PAYMENT_TIMEOUT = 60;


export class Hub extends EventEmitter {
    private static hub: Hub;
    private logger: Logger;
    readonly polling = true;

    private constructor(public service: ClientService) {
        super();
        this.logger = new Logger("Hub");
        this.setup()
    }

    static Get() {
        if (this.hub == undefined) {
            throw Error("Not initialized Hub");
        }
        return this.hub;
    }

    static Create(service: ClientService) {
        if (this.hub != undefined) {
            throw Error("Already initialized Hub");
        }
        this.hub = new Hub(service);
    }

    log(msg: string) {
        this.logger.log("|" + msg);
    }

    log_mc_state(mc: MerchantCustomer, state: string) {
        this.log(mc.id.slice(0, 10) + "|" + state);
    }

    // async withdraw_payment(mc:MerchantCustomer) {
    //     let { accepted, signedTx } = await mc.cclient.channel.withdraw(
    //                                             Number.parseInt(mc.amount_str));
    //     if (!accepted) {
    //         throw new Error("cannot remove "+(mc.amount)+ " for merchant: "+mc.merchant);
    //     }
    //     let { d_accepted, state } = await mc.mclient.channel.deposit(
    //                                             Number.parseInt(mc.amount_str));
    //     if (!d_accepted) {
    //         throw new Error("cannot deposit into merchant: "+mc.merchant);
    //     }
    // }

    private setup() {
        this.on("user-payment-request", (msg, emitter_channel) => {
            this.payment_request(msg, emitter_channel)
                .then((mc) => {
                    this.emit("payment-request-accepted", mc)
                })
                .catch((err) => {
                    this.emit("payment-request-rejected",
                        MerchantCustomer.paymentRejected(err, msg), emitter_channel)
                });
        });
        this.on("payment-request-rejected", (err_msg, emitter_channel) => {
            emitter_channel.sendMessage(err_msg).then(voidf).catch(console.error);
        });
        this.on("payment-request-accepted", (mc) => {
	       this.log_mc_state(mc, "pre-accepted");
            setTimeout( () => {
	       this.log_mc_state(mc, "accepted");
               mc.sendCustomer(mc.msgPaymentAccepted());
	    }, 4000);
        });
        this.on("wait-payment", (mc, pre_balance) => {
            this.log_mc_state(mc, "waiting");

            if (this.polling) {
                this.wait_payment_polling(mc, pre_balance)
                    .then(() => {
                        this.emit("payment-request-completed", mc)
                    })
                    .catch(() => {
                        this.emit("payment-request-canceled", mc)
                    });
            } else {
                setTimeout(()=>{
                    mc.paymentTimedout();
                }, WAIT_PAYMENT_TIMEOUT * 1000);
                this.wait_payment_non_polling(mc, pre_balance)
                    .then(voidf)
                    .catch(console.error);
            }
        });
        this.on("payment-request-completed", (mc) => {
            this.log_mc_state(mc, "completed");
            mc.sendCustomer(mc.msgPaymentRequestCompleted());
            mc.sendMerchant(mc.msgPaymentRequestCompleted());
        });
        this.on("payment-request-canceled", (mc) => {
            this.log_mc_state(mc, "canceled");
            mc.sendCustomer(mc.msgPaymentRequestCanceled());
        });

    }

    async wait_payment_non_polling(mc: MerchantCustomer, pre_balance) {
        return mc.cclient.channel.pendingPayment(mc);
    }

    async wait_payment_polling(mc: MerchantCustomer, pre_balance) {
        const start = Date.now();
        const timeout = WAIT_PAYMENT_TIMEOUT * 1000;
        while (Date.now() - start < timeout) {
            let last_balance = await mc.cclient.channel.hub_balance();
            let sum = pre_balance.plus(mc.amount);
            this.log(`check balance..: ${pre_balance.toString(10)} ${last_balance.toString(10)} to ${sum.toString(10)} ..`);
            if (last_balance.isGreaterThanOrEqualTo(pre_balance.plus(mc.amount))) {
                const mca = mc.getEntity();
                await RepoService.save(mca);
                return
            }
            await sleep(100);
        }
        this.log("Wait for balance timed out...");
        throw new PaymentTimeout();
    }

    async payment_request(msg, emitter_channel) {
        let mc;
        this.log("pay-request: " + (mystringify(msg)));
        try {
            mc = MerchantCustomer.FromRequest(msg, emitter_channel);
            let pre_balance = await mc.cclient.channel.hub_balance();
            this.emit("wait-payment", mc, pre_balance);
            return mc;
        } catch (err) {
            this.log("payment-request ignored: " + JSON.stringify(err));
            throw err;
        }
    }
}
