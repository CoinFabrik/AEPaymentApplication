<template>
  <div class="confirm-payment">
    <AeText align="center" face="sans-l">Please check your payment</AeText>

    <div class="paymentinfo">
      <div class="row">
        <div class="column">
          <AeText weight="700">Merchant</AeText>
        </div>
        <div class="column">
          <AeText>{{ paymentData.merchant_name }}</AeText>
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
import { AeText, AeButtonGroup, AeButton } from "@aeternity/aepp-components";

import BigNumber from "bignumber.js";
import { clearInterval } from "timers";

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
            paymentRequestMessage["customerid"] = this.$state.getters.initiatorAddress;
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