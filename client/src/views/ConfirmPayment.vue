<template>
  <b-container class="confirm-payment">
    <AeText weight="bold" align="center" face="sans-l">Check your payment</AeText>
		<AeDivider/>
    <div class="paymentinfo">
      <div class="row">
        <div class="column">
          <AeText fill="secondary" face="sans-base">Merchant</AeText>
        </div>
        <div class="column">
          <AeText face="mono-base">{{ paymentData.merchant_name }}</AeText>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <AeText fill="secondary" face="sans-base">Amount</AeText>
        </div>
        <div class="column">
          <AeText face="mono-base">{{ amountAE }} AE</AeText>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <AeText fill="secondary" face="sans-base">Concept</AeText>
        </div>
        <div class="column">
          <AeText face="mono-base">{{ paymentData.something }}</AeText>
        </div>
      </div>
    </div>
		<AeDivider/>
		<AeButton class="button" face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
		<AeButton class="button" face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
  </b-container>
</template>

<script>
import { AeText, AeButton, AeDivider } from "@aeternity/aepp-components";

import BigNumber from "bignumber.js";
import { clearInterval } from "timers";

export default {
  name: "ConfirmPayment",
  components: {
    AeButton,
    AeText,
		AeDivider
  },
  props: {
    paymentData: Object
  },
  data() {
    return {};
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
    async triggerPayment() {
      let timerInterval;
      this.$swal
        .fire({
          heightAuto: false,
          allowOutsideClick: false,
          type: "info",
          title: "Please wait",
          html: "While we process your payment...",
          timer: 4000, //process.env.CUSTOMER_PAYMENT_TIMEOUT,
          onBeforeOpen: () => {
            this.$swal.showLoading();
          },
          onOpen: async () => {
            let paymentRequestMessage = paymentData;
            paymentRequestMessage[
              "customerid"
            ] = this.$state.getters.initiatorAddress;
            console.warn("Sending payment message:", paymentRequestMessage);
            await this.$store.state.channel.sendMessage(
              paymentRequestMessage,
              this.$store.getters.responderAddress
            );

            // wait for accepted or rejected message from hub.
          },
          onClose: () => {
            clearInterval(timerInterval);
          }
        })
        .then(result => {
          if (result.dismiss === this.$swal.DismissReason.timer) {
            this.$swal.fire({
              heightAuto: false,
              type: "error",
              title: "Oops!",
              html:
                "Your payment submission has timed out. This may indicate connection problems. <br> Please try again later"
            });
          }
        });
    },
    cancel() {
      this.$router.replace("main-menu");
    },
    async confirm() {
      await this.triggerPayment();
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