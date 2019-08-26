<template>
  <b-container class="confirm-payment">
    <AeText
      weight="bold"
      align="center"
      face="sans-l"
    >
      Check your payment
    </AeText>
    <div class="paymentinfo">
      <div class="row">
        <div class="column">
          <AeText
            fill="secondary"
            face="sans-base"
          >
            Merchant
          </AeText>
        </div>
        <div class="column">
          <AeText face="mono-base">
            {{ registeredMerchantName }}
          </AeText>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <AeText
            fill="secondary"
            face="sans-base"
          >
            Amount
          </AeText>
        </div>
        <div class="column">
          <AeText face="mono-base">
            {{ amountAE }} AE
          </AeText>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <AeText
            fill="secondary"
            face="sans-base"
          >
            Concept
          </AeText>
        </div>
        <div class="column">
          <AeText face="mono-base">
            {{ paymentData.something }}
          </AeText>
        </div>
      </div>
    </div>
    <AeDivider />
    <AeButton
      class="margin"
      face="round"
      fill="primary"
      extend
      @click="confirm()"
    >
      Confirm
    </AeButton>
    <AeButton
      class="margin"
      face="round"
      fill="secondary"
      extend
      @click="cancel()"
    >
      Cancel
    </AeButton>
  </b-container>
</template>

<script>
/* eslint-disable no-console */
const PAYMENT_UNKNOWN = 0,
  PAYMENT_ACK_REJECTED = 1,
  PAYMENT_ACK_ACCEPTED = 2,
  PAYMENT_UPDATE_REJECTED = 3,
  PAYMENT_UPDATE_ACCEPTED = 4,
  PAYMENT_COMPLETED = 5;
let paymentProcessStatus = PAYMENT_UNKNOWN;
let paymentRejectInfo;

import { AeText, AeButton, AeDivider } from "@aeternity/aepp-components";
import { EventBus } from "../event/eventbus";
import BigNumber from "bignumber.js";
import { clearInterval, setInterval } from "timers";
import HubConnection from "../controllers/hub";

export default {
  name: "ConfirmPayment",
  components: {
		AeButton,
		AeDivider,
    AeText
  },
  props: {
    paymentData: Object
  },
  data() {
    return {
      registeredMerchantName: "N/A"
    };
  },
  computed: {
    amountAE() {
      const BN = new BigNumber(this.paymentData.amount)
        .dividedBy(new BigNumber(10).exponentiatedBy(18))
        .toString(10);
      return BN.toString();
    }
  },
  async mounted() {
    await this.queryMerchantName();
    if (this.registeredMerchantName === "N/A") {
      this.$swal.fire({
        type: "warning",
        html:
          "The merchant name for this payment could not be determined. <br>" +
          "This may indicate network problems. Dismiss this payment if you are not sure of the payment origin"
      });
    }
  },
  methods: {
    async queryMerchantName() {
      const hub = new HubConnection(
        this.$store.state.hubUrl,
        this.paymentData.merchant
      );
      let r = await hub.getRegisteredName("merchant");
      if (r.success) {
        this.registeredMerchantName = r.name;
      }
    },
    async sendPaymentRequest() {
      let paymentRequestMessage = this.paymentData;
      paymentRequestMessage["customer"] = this.$store.getters.initiatorAddress;
      console.warn("Sending payment message:", paymentRequestMessage);
      await this.$store.state.channel.sendMessage(
        paymentRequestMessage,
        this.$store.getters.responderAddress
      );
    },
    onPaymentComplete() {
      paymentProcessStatus = PAYMENT_COMPLETED;
      this.$swal.close();
    },
    async onPaymentRequestAck(eventdata) {
      console.log("Received Payment_ack event: ", eventdata);
      if (eventdata.st === "accepted") {
        paymentProcessStatus = PAYMENT_ACK_ACCEPTED;
        //
        // We can trigger the update now.
        //
        console.log("Payment request ACK: accepted.  Sending update... ");
        try {
          await this.$store.dispatch(
            "triggerUpdate",
            parseInt(this.paymentData.amount)
          );
          paymentProcessStatus = PAYMENT_UPDATE_ACCEPTED;

          // Wait for completion now.
          EventBus.$once("payment-request-completed", this.onPaymentComplete);
        } catch (e) {
          paymentProcessStatus = PAYMENT_UPDATE_REJECTED;
          paymentRejectInfo = e.toString();
          this.$swal.close();
        }
      } else if (eventdata.st === "rejected") {
        paymentProcessStatus = PAYMENT_ACK_REJECTED;
        paymentRejectInfo = eventdata.rejectMsg;
        this.$swal.close();
      } else {
        console.error(
          "The eventdata of payment-request-ack is unknown: " + eventdata.st
        );
      }
    },
    async triggerPayment() {
      this.$swal
        .fire({
          heightAuto: false,
          allowOutsideClick: false,
          type: "info",
          title: "Please wait",
          html: "While we process your payment...",
          timer: process.env.CUSTOMER_PAYMENT_TIMEOUT,
          onBeforeOpen: () => {
            this.$swal.showLoading();
          },
          onOpen: async () => {
            //
            // Setup wait-once for accepted or rejected message from hub.
            //
            EventBus.$once("payment-request-ack", this.onPaymentRequestAck);
            await this.sendPaymentRequest();
          }
        })
        .then(result => {
          if (result.dismiss === "timer") {
            this.$swal.fire({
              heightAuto: false,
              type: "error",
              title: "Oops!",
              html:
                "Your payment submission has timed out. This may indicate connection problems. <br> Please try again later"
            });
          }
          const emptyResult = !Object.keys(result).length;
          if (emptyResult) {
            if (paymentProcessStatus === PAYMENT_ACK_REJECTED) {
              this.$swal.fire({
                heightAuto: false,
                type: "error",
                title: "Oops!",
                html:
                  "The Payment Hub has rejected your payment <br> Please try again later <br><br> Reason: " +
                  paymentRejectInfo
              });
            } else if (paymentProcessStatus === PAYMENT_UPDATE_REJECTED) {
              this.$swal.fire({
                heightAuto: false,
                type: "error",
                title: "Oops!",
                html:
                  "The transfer of funds over the channel has been rejected <br> Please try again later"
              });
            } else if (paymentProcessStatus === PAYMENT_COMPLETED) {
              this.$swal
                .fire({
                  heightAuto: false,
                  type: "success",
                  title: "Thank you",
                  html: "Your payment has been successfully submitted."
                })
                .then(() => {
                  this.$router.replace("main-menu");
                });
            }
          }
        });
    },
    cancel() {
      this.$router.replace("main-menu");
    },
    async confirm() {
      console.log("X");
      // are we connected ?
      let timerInterval;

      if (this.$store.state.channel.status() === "disconnected") {
        console.warn(
          "We are offline (state is DISCONNECTED), trying to reconnect... "
        );
        this.$swal
          .fire({
            type: "warning",
            title: "You are offline",
            text: "Please wait while reconnecting...",
            heightAuto: false,
            showConfirmButton: false,
            allowOutsideClick: false,
            timer: process.env.CHANNEL_RECONNECT_TIMEOUT,
            onBeforeOpen: () => {
              //this.$store.dispatch("reconnectChannel");
              this.$swal.showLoading();
              timerInterval = setInterval(() => {
                if (this.$store.state.channel.status === "open") {
                  this.$swal.close();
                }
              }, 500);
            },
            onClose: () => {
              clearInterval(timerInterval);
            }
          })
          .then(result => {
            if (result.dismiss === "timer") {
              this.$swal.fire({
                heightAuto: false,
                type: "error",
                html:
                  "We could not go online mode. This may indicate connection problems. <br> <br>" +
                  "<ul><li>Re-try again in a moment or,</li>" +
                  "<li>Ask the merchant to process the offline payment for you instead</li></ul>"
              });
            }
          });
      }
      if (this.$store.state.channel.status() === "open") {
        await this.triggerPayment();
      }
    }
  }
};
</script>

<style>
.row {
  display: flex;
}

.column {
  flex: 50%;
}

.paymentinfo {
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>