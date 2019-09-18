<template>
  <b-container class="show-payment-qr">
    <!-- <ViewTitle title="Show this QR" /> -->

    <div class="mt-3">
      <AeText face="sans-xs">
        Amount:
        <b>{{ amountAE }} AE</b>
      </AeText>
      <AeText v-show="message.something.length > 0" face="sans-xs">
        Concept:
        <b>{{ message.something }}</b>
      </AeText>
    </div>
    <div class="mt-2">
      <AeQRCode :value="messageString" />
      <div v-if="this.$isOnDemandMode && waitingPayment">
        <AeText face="sans-xs">Waiting for payment ... {{ timeRemaining }} s</AeText>
        <AeLoader />
      </div>
    </div>

    <AeButton
      face="round"
      fill="primary"
      class="mt-2"
      extend
      @click="done()"
    >{{ this.waitingPayment ? "Cancel" : "Done" }}</AeButton>
  </b-container>
</template>

<script>
import { setTimeout } from "timers";
import { DisplayUnitsToAE } from "../util/numbers";
import BigNumber from 'bignumber.js';
const PAYMENT_TIMEOUT_SECONDS = 60;

export default {
  name: "MainMenu",
  props: {
    message: Object
  },
  data() {
    return { paymentCode: "", timeRemaining: 0, waitingPayment: false };
  },
  computed: {
    messageString: function() {
      return JSON.stringify(this.message);
    },
    amountAE() {
      return DisplayUnitsToAE(this.message.amount, { rounding: BigNumber.ROUND_UP });
    }
  },
  async mounted() {
    if (this.$isOnDemandMode) {
      this.timeRemaining = PAYMENT_TIMEOUT_SECONDS;
      window.eventBus.$once("payment-complete-ack", e => {
        this.waitingPayment = false;
        this.showPaymentReceived(e);
      });
      try {
        this.$swal.fire({
          text: "Opening payment channel",
          allowOutsideClick: false,
          onBeforeOpen: () => {
            this.$swal.showLoading();
          }
        });
        await this.$store.dispatch("openChannel", true);
        this.$swal.close();
      } catch (e) {
        this.$swal
          .fire({
            type: "error",
            title: "Sorry",
            text: e => {
              if (e.toString() === "no-reconnect-info")
                return "Cannot open channel due to re-connection info not available.";
              else if (e.toString() === "reconnect-info-error")
                return "Cannot fetch re-connection info from payment hub at this time";
              else "We could not open your channel.  Reason is " + e.toString();
            }
          })
          .then(() => {
            this.$router.replace("main-menu");
          });
      }
      this.waitingPayment = true;
      this.waitEvent();
    }
  },
  beforeDestroy() {
    this.waitingPayment = false;
  },
  methods: {
    async done() {
      this.waitingPayment = false;
      await this.$store.dispatch("leaveChannel");
      this.$router.replace("main-menu");
    },
    showPaymentReceived(e) {
      console.log("payment-received: " + JSON.stringify(e));
      if (e.eventdata === "completed") {
        let concept = "";
        if (e.info.something !== "") {
          concept = " as payment for <b> " + e.info.something + "</b>";
        }
        this.$swal.fire({
          type: "success",
          title: "Payment Received",
          html:
            "You received " +
            "<b>" +
            DisplayUnitsToAE(e.info.amount, { rounding: BigNumber.ROUND_UP }) +
            " AE </b> from <b>" +
            e.info.customer_name +
            "</b>" +
            concept,
          onClose: async () => {
            await this.$store.dispatch("leaveChannel");
            this.$router.replace("main-menu");
          }
        });
      } else if (e.eventdata === "canceled") {
        this.$swal.fire({
          type: "error",
          title: "Sorry",
          text:
            "The payment hub canceled the payment.  Please try again later.",
          onClose: async () => {
            await this.$store.dispatch("leaveChannel");
            this.$router.replace("main-menu");
          }
        });
      }
    },
    async showPaymentTimeout() {
      this.$swal.fire({
        type: "warning",
        title: "Time out",
        text: "No payment was received.",
        onClose: async () => {
          await this.$store.dispatch("leaveChannel");
          this.$router.replace("main-menu");
        }
      });
    },
    waitEvent() {
      if (this.waitingPayment) {
        if (this.timeRemaining === 0) {
          this.waitingPayment = false;
          this.showPaymentTimeout();
        } else {
          this.timeRemaining--;
          setTimeout(this.waitEvent, 1000);
        }
      }
    }
  }
};
</script>
