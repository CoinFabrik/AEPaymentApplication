<template>
  <div></div>
</template>

<script>
/* eslint-disable no-console */
const POLL_INTERVAL_MS = 1000;
import "sweetalert2/dist/sweetalert2.min.css";
//import BigNumber from "bignumber.js";
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
      this.$store.state.aeternity.setRegisteredUpdateHandler(
        this.onChannelUpdateAck
      );
      this.$store.state.channel.on("statusChanged", this.onChannelStatusChange);
      this.$store.state.channel.on("message", this.onChannelMessage);
      setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
    },
    onDesuscribeToChannel() {
      console.warn("ChannelNotify: Received request to desuscribe to Channel");
      this.$store.state.aeternity.setRegisteredUpdateHandler(null);
      this.$store.state.channel.on("statusChanged", null);
      this.$store.state.channel.on("message", null);
    },
    onChannelStatusChange() {},
    onChannelMessage(msg) {
      console.log("PoS Message received: ", msg);
      this.messageQueue.push(msg);
    },
    onChannelUpdateAck(updateInfo) {
      // Check if we are waiting for signing a purchase that we got through last buy_request message.
      const lastBuyReq = this.$store.state.buyRequestInfo;

      console.log("Last known Buy Request data: ", lastBuyReq);
      console.log("Channel Update Information: ", updateInfo);

      if (
        lastBuyReq &&
        lastBuyReq.amount === updateInfo.amount &&
        lastBuyReq.customer === updateInfo.from &&
        this.$store.getters.responderAddress === updateInfo.to
      ) {
        return this.showRequestPaymentModal(
          lastBuyReq.amount,
          lastBuyReq.something,
          lastBuyReq.mechant_name
        );
      } else {
        this.$swal({
          title: "Oops",
          text:
            "We found a Hub request to sign a  purchase you didn't seem to ask. Please contact the application support after dismissing this notice",
          type: "warning"
        });
        return false;
      }
    },
    checkMessageQueue() {
      if (this.messageQueue.length > 0) {
        const msg = this.messageQueue.pop();

        // Decode message
        const infoObj = JSON.parse(msg.info);
        if (infoObj.type === "heartbeat") {
          console.warn("Heartbeat message received in channel");
          this.$store.state.channel.sendMessage(
            "heartbeat-ack",
            this.$store.getters.responderAddress
          );
        } else if (infoObj.type === "buy-request") {
          console.log("Buy-request message received in channel: ", msg);
          this.$store.commit("storeLastBuyRequestInfo", {
            id: infoObj.id,
            merchant: infoObj.merchant,
            customer: infoObj.customer,
            amount: infoObj.amount,
            merchant_name: infoObj.merchant_name,
            something: infoObj.something
          });
        } else {
          console.warn("An unknown message was present in queue: ", msg);
        }
      }
      setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
    },
    showRequestPaymentModal(amount, what, merchant_name) {
      return this.$swal({
        title: "Are you sure?",
        text:
          "Accept payment of " +
          amount +
          " AE for your PURCHASE at " +
          merchant_name +
          "?",
        allowOutsideClick: false,
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Accept",
        cancelButtonText: "Reject",
        showCloseButton: false,
        showLoaderOnConfirm: true
      })
        .then(result => {
          if (result.value) {
            // reset last buyRequest
            this.$store.commit("clearLastBuyRequestInfo");

            this.$swal(
              "Thanks!",
              "You successfully paid for your purchase",
              "success"
            );
            return true;
          } else {
            this.$swal("Cancelled", "You cancelled your purchase", "info");
            return false;
          }
        })
        .catch(alert);
    }
  },
  mounted() {
    EventBus.$on("suscribe-channel", this.onSuscribeToChannel);
    EventBus.$on("desuscribe-channel", this.onSuscribeToChannel);
  },
  destroyed() {}
};
</script>
