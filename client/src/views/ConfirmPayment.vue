<template>
  <div class="confirm-payment">
    <AeText align="center" face="sans-l">Please check your payment</AeText>

    <div class="paymentinfo">
      <div class="row">
        <div class="column">
          <AeText weight="700">Merchant</AeText>
        </div>
        <div class="column">
          <AeText>{{ registeredMerchantName }}</AeText>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <AeText weight="700">Amount</AeText>
        </div>
        <div class="column">
          <AeText>{{ amountAE }} AE</AeText>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <AeText weight="700">Concept</AeText>
        </div>
        <div class="column">
          <AeText>{{ paymentData.something }}</AeText>
        </div>
      </div>
    </div>

    <ae-button-group>
      <AeButton face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
      <AeButton face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
    </ae-button-group>
  </div>
</template>

<script>
/* eslint-disable no-console */
const PAYMENT_UNKNOWN = 0,
  PAYMENT_ACK_REJECTED = 1,
  PAYMENT_ACK_ACCEPTED = 2,
  PAYMENT_UPDATE_REJECTED = 3,
  PAYMENT_UPDATE_ACCEPTED = 4;
let paymentProcessStatus = PAYMENT_UNKNOWN;
let paymentRejectInfo;

import { AeText, AeButtonGroup, AeButton } from "@aeternity/aepp-components";
import { EventBus } from "../event/eventbus";
import BigNumber from "bignumber.js";
import { clearInterval } from "timers";
import HubConnection from "../controllers/hub";

export default {
  name: "ConfirmPayment",
  components: {
    AeButton,
    AeText,
    AeButtonGroup
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
  methods: {
    async queryMerchantName() {
      const hub = new HubConnection(
        this.$store.state.hubUrl,
        this.paymentData.merchant
      );
      try {
        let r = await hub.getRegisteredName("merchant");
        if (r.success) {
          this.registeredMerchantName = r.name;
        }
        this.registeredMerchantName = "N/A";
      } catch (e) {
        this.registeredMerchantName = "N/A";
      }
    },
    async sendPaymentRequest() {
      let paymentRequestMessage = this.paymentData;
      paymentRequestMessage[
        "customerid"
      ] = this.$store.getters.initiatorAddress;
      console.warn("Sending payment message:", paymentRequestMessage);
      await this.$store.state.channel.sendMessage(
        paymentRequestMessage,
        this.$store.getters.responderAddress
      );
    },
    async onPaymentRequestAck(eventdata) {
      console.log("Received Payment_ack event: " ,eventdata);
      if (eventdata.st === "accepted") {
        paymentProcessStatus = PAYMENT_ACK_ACCEPTED;
        //
        // We can trigger the update now.
        //
        console.log("Payment request ACK: accepted.  Sending update... ");
        try {
          await this.$store.dispatch("triggerUpdate", this.paymentData.amount);
          paymentProcessStatus = PAYMENT_UPDATE_ACCEPTED;
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
      let timerInterval;
      this.$swal
        .fire({
          heightAuto: false,
          allowOutsideClick: false,
          type: "info",
          title: "Please wait",
          html: "While we process your payment...",
          timer: 10000, //process.env.CUSTOMER_PAYMENT_TIMEOUT,
          onBeforeOpen: () => {
            this.$swal.showLoading();
          },
          onOpen: async () => {
            //
            // Setup wait-once for accepted or rejected message from hub.
            //
            EventBus.$once("payment-request-ack", this.onPaymentRequestAck);
            await this.sendPaymentRequest();
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
              title: "Oops!",
              html:
                "Your payment submission has timed out. This may indicate connection problems. <br> Please try again later"
            });
          }
          const emptyResult =  !Object.keys(result).length;
          if (emptyResult) {
            if (paymentProcessStatus === PAYMENT_ACK_REJECTED) {
              this.$swal.fire({
                heightAuto: false,
                type: "error",
                title: "Oops!",
                html:
                  "The Payment Hub has rejected your payment <br> Please try again later <br><br> Reason: " + paymentRejectInfo
              });
            } else if (paymentProcessStatus === PAYMENT_UPDATE_REJECTED) {
              this.$swal.fire({
                heightAuto: false,
                type: "error",
                title: "Oops!",
                html:
                  "The transfer of funds over the channel has been rejected <br> Please try again later"
              });
            } else if (paymentProcessStatus === PAYMENT_UPDATE_ACCEPTED) {
              this.$swal.fire({
                heightAuto: false,
                type: "success",
                title: "Thank you",
                html: "Your payment has been successfully submitted."
              });
            }
          }
        });
    },
    cancel() {
      this.$router.replace("main-menu");
    },
    async confirm() {
      await this.triggerPayment();
    }
  },
  async mounted() {
    await this.queryMerchantName();
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