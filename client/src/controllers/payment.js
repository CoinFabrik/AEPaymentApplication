
/* eslint-disable no-console */
//import { window.eventBus } from "../event/eventbus";
import aeternity from "../controllers/aeternity"
const EventEmitter = require('events');
const PAYMENT_STATE_INITIAL = 0,
  PAYMENT_STATE_AWAITING_ACK = 1,
  PAYMENT_STATE_UPDATING = 2,
  PAYMENT_STATE_REJECTED = 3,
  PAYMENT_STATE_COMPLETED = 4,
  PAYMENT_STATE_UPDATE_REJECTED = 5,
  PAYMENT_STATE_UPDATE_ERROR = 6,
  PAYMENT_STATE_AWAITING_COMPLETE_ACK = 7

export default class PaymentProcessor extends EventEmitter {
  constructor(customerAddress, hubAddress, paymentData, channel) {
    super();
    this.paymentData = paymentData;
    this.customerAddress = customerAddress;
    this.hubAddress = hubAddress;
    this.channel = channel;
    this.status = PAYMENT_STATE_INITIAL;
  }

  send() {
    var that = this;
    this.paymentData["customer"] = this.customerAddress;
    let paymentRequestMessage = this.paymentData;
    console.warn("PaymentProcessor: Sending payment message", paymentRequestMessage);

    this.status = PAYMENT_STATE_AWAITING_ACK;

    window.eventBus.$once("payment-request-ack", function (e) { that.onPaymentRequestAck(e) });
    this.channel.sendMessage(
      paymentRequestMessage, this.hubAddress
    );
  }

  update() {
    var that = this;
    window.eventBus.$once("payment-complete-ack", function (e) { that.onPaymentCompleteAck(e) });

    aeternity.update(this.channel, this.customerAddress, this.hubAddress, this.paymentData.amount).then(
       ({ accepted, signedTx }) => {
        if (accepted) {
          console.log("PaymentProcessor:  accepted update TX " + signedTx);
          this.status = PAYMENT_STATE_AWAITING_COMPLETE_ACK;
        } else {
          console.log("PaymentProcessor:  rejected update ");
          this.status = PAYMENT_STATE_UPDATE_REJECTED;
          this.emit("payment-update-rejected", "None");
        }
      }).catch((err) => {
        this.status === PAYMENT_STATE_UPDATE_ERROR;
        this.emit("payment-update-rejected", err)
      })
  }

  onPaymentRequestAck(e) {
    console.log("eventdata=" + e.eventdata + " info=" + e.info);
    if (this.status === PAYMENT_STATE_AWAITING_ACK) {
      if (e.eventdata === "accepted") {

        console.warn("PaymentProcessor: Payment-request ACCEPTED message received");

        this.status = PAYMENT_STATE_UPDATING;
        this.emit("payment-request-accepted");
        this.update();
      }
      else if (e.eventdata === "rejected") {
        console.warn("PaymentProcessor: Payment-request REJECTED message received");

        if (this.status === PAYMENT_STATE_AWAITING_ACK) {
          this.status = PAYMENT_STATE_REJECTED;
          this.emit("payment-request-rejected", e.info);
        }
      }
    } else {
      console.error("PaymentProcessor: Not in PAYMENT_STATE_AWAITING_ACK state , but " + this.status);
    }
  }

  onPaymentCompleteAck(e) {

    if (this.status === PAYMENT_STATE_AWAITING_COMPLETE_ACK) {
      if (e.eventdata === "canceled") {

        console.warn("PaymentProcessor: Payment-request CANCELED message received");
        this.status = PAYMENT_STATE_CANCELED;
        this.emit("payment-request-canceled");
      }

      else if (e.eventdata === "completed") {
        console.warn("PaymentProcessor: Payment-request COMPLETED message received");

        this.status = PAYMENT_STATE_COMPLETED;
        this.emit("payment-request-completed");
      }

    } else {
      console.error("PaymentProcessor: Not in PAYMENT_STATE_AWAITING_COMPLETE_ACK state, but " + this.status);
    }

  }

}