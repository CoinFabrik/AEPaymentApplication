<template>
  <div></div>
</template>

<script>
/* eslint-disable no-console */
const POLL_INTERVAL_MS = 1000;
import "sweetalert2/dist/sweetalert2.min.css";
import BigNumber from "bignumber.js";
import { EventBus } from "../event/eventbus";

export default {
  name: "ChannelNotify",
  components: {},
  data() {
    return {
      messageQueue: []
    };
  },
  props: {},
  methods: {
    onSuscribeToChannel() {
      console.warn("ChannelNotify: Received request to suscribe to Channel");
      this.$store.state.channel.on("statusChanged", this.onChannelStatusChange);
      this.$store.state.channel.on("message", this.onChannelMessage);
      setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
    },
    onChannelStatusChange() {},
    onChannelMessage(msg) {
      console.log("PoS Message received: ", msg);
      this.messageQueue.push(msg);
    },
    checkMessageQueue() {
      if (this.messageQueue.length > 0) {
        const msg = this.messageQueue.pop();
        console.log("Message found in queue: ");
        console.log(msg);

        // Decode message

        const infoObj = JSON.parse(msg.info);
        if (infoObj.kind === "request_payment") {
          this.showRequestPaymentModal(infoObj.amount, infoObj.seller).then(
            () => {
              setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
              return;
            }
          );
        } else {
          console.warn("An unknown message was present in queue");
        }
      }
      setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
    },
    showRequestPaymentModal(amount, seller) {
      return this.$swal({
        title: "Are you sure?",
        text:
          "Do you want to PAY " +
          amount +
          " Æ for your PURCHASE at " +
          seller +
          "?",
        allowOutsideClick: false,
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Pay",
        cancelButtonText: "Reject",
        showCloseButton: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            await this.$store.dispatch(
              "transferTokensToResponder",
              amount * 10 ** 18
            );
          } catch (err) {
            this.$swal.showValidationMessage(
              "Payment failed. Reason is: " + err.toString()
            );
          }
        }
      })
        .then(result => {
          if (result.value) {
            this.$swal(
              "Thanks!",
              "You successfully paid for your purchase",
              "success"
            );
          } else {
            this.$swal("Cancelled", "You cancelled your purchase", "info");
          }
        })
        .catch(alert);
    }
  },
  mounted() {
    EventBus.$on("suscribe-channel", this.onSuscribeToChannel);
  },
  destroyed() {}
};
</script>
