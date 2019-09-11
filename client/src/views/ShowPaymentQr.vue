<template>
  <b-container class="show-payment-qr">
    <AeText weight="bold">
      Show this payment QR to your customer
    </AeText>
    <br>
    <AeText face="sans-s">
      Amount: <b>{{ amountAE }} AE</b>
    </AeText>
    <AeText
      v-show="message.something.length > 0"
      face="sans-s"
    >
      Concept: <b>{{ message.something }}</b>
    </AeText>

    <div class="my-3">
      <AeQRCode :value="messageString" />
      <div v-if="this.$isOnDemandMode && waitingPayment">
        <AeText face="sans-xs">
          Waiting for payment ... {{ timeRemaining }} s
        </AeText>
        <AeLoader />
      </div>
    </div>

    <AeButton
      face="round"
      fill="primary"
      class="margin"
      extend
      @click="done()"
    >
      Done
    </AeButton>
  </b-container>
</template>

<script>
import { setTimeout } from "timers";
import { DisplayUnitsToAE } from "../util/numbers";
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
      return DisplayUnitsToAE(this.message.amount);
    }
  },
  async mounted() {
    if (this.$isOnDemandMode) {
      this.timeRemaining = PAYMENT_TIMEOUT_SECONDS;
      window.eventBus.$once("payment-complete-ack", e => {
        this.waitingPayment = false;
        this.showPaymentReceived(e);
      });
      await this.$store.dispatch("openChannel");
      this.waitingPayment = true;
      this.waitEvent();
    }
  },
  beforeDestroy() {
    this.waitingPayment = false;
  },
  methods: {

    done() {
      this.$router.replace("main-menu");
    },
    showPaymentReceived(e) {
      console.log("payment-received: " + JSON.stringify(e));
      if (e.eventdata === "completed") {
        let concept = "";
        if (e.info.something !== "") {
          concept = " in concept of " + e.info.something;
        }
        this.$swal.fire({
          type: "success",
          title: "Payment Received",
          text:
            "You received " +
            DisplayUnitsToAE(e.info.amount) +
            " AE from " +
            e.info.customer_name +
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
        type: "error",
        title: "Sorry",
        text: "A payment was not received in the expected time.",
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
