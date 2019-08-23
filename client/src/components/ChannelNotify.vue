<template>
  <div></div>
</template>

<script>
/* eslint-disable no-console */
const POLL_INTERVAL_MS = 400;
import "sweetalert2/dist/sweetalert2.min.css";
import BigNumber from "bignumber.js";
import { EventBus } from "../event/eventbus";
import HubConnection from "../controllers/hub";
import aeternity from "../controllers/aeternity";

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
    async notifyPaymentReceived(amount, something, customer) {
      let customerName = "(unknown)";
      const hub = new HubConnection(this.$store.state.hubUrl, customer);
      let r = await hub.getRegisteredName("client");
      if (r.success) {
        customerName = r.name;
      }
      await this.$swal.fire({
        heightAuto: true,
        title: "Payment Received",
        text:
          "You received " +
          amount / 10 ** 18 +
          " AE from " +
          customerName +
          (something !== "" ? " in concept of " + something : "") +
          ". This payment will be accredited in your In-hub balance"
      });
      await this.$store.dispatch("updateHubBalance");
    },
    onSuscribeToChannel() {
      console.warn("ChannelNotify: Received request to suscribe to Channel");
      aeternity.setUpdateHandler(this.onChannelUpdateAck);
      aeternity.setAfterUpdateAckSignHandler(this.onAfterUpdateAckSign);
      this.$store.state.channel.on("statusChanged", this.onChannelStatusChange);
      this.$store.state.channel.on("message", this.onChannelMessage);
      setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
    },
    onDesuscribeToChannel() {
      console.warn("ChannelNotify: Received request to desuscribe to Channel");
      aeternity.setUpdateHandler(null);
      aeternity.setAfterUpdateAckSignHandler(null);
      this.$store.state.channel.on("statusChanged", null);
      this.$store.state.channel.on("message", null);
    },
    onChannelStatusChange(status) {
      // We suscribe to this after channel is successfully open
      // (we won't get this at initial connect)
      if (status === "disconnected") {
        console.warn("Channel DISCONNECTED");
      }
    },
    onChannelMessage(msg) {
      console.log("Channel Message received: ", msg);
      this.messageQueue.push(msg);
    },
    async onAfterUpdateAckSign() {
      await this.$store.dispatch("updateChannelBalances");
    },
    onChannelUpdateAck(/* updateInfo */) {},
    async checkMessageQueue() {
      if (this.messageQueue.length > 0) {
        const msg = this.messageQueue.pop();

        // Decode message
        const infoObj = JSON.parse(msg.info);
        if (infoObj.type === "heartbeat") {
          console.warn("Heartbeat message received in channel - IGNORED");

          // By SDK >= 4.4.0, Still-alive pinging mechanism is built-in.

          // this.$store.state.channel.sendMessage(
          //   "heartbeat-ack",
          //   this.$store.getters.responderAddress
          // );
        } else if (infoObj.type === "payment-request-accepted") {
          console.warn(
            "Payment-request ACCEPTED message received in channel: ",
            msg
          );
          if (this.$isClientAppRole) {
            EventBus.$emit("payment-request-ack", { st: "accepted" });
          } else {
            console.warn("unexpected message for MERCHANT role");
          }
        } else if (infoObj.type === "payment-request-rejected") {
          console.warn(
            "Payment-request REJECTED message received in channel: ",
            msg
          );
          EventBus.$emit("payment-request-ack", {
            st: "rejected",
            rejectMsg: infoObj.msg
          });
        } else if (infoObj.type === "payment-request-canceled") {
          console.warn(
            "Payment-request CANCELED message received in channel: ",
            msg
          );
          EventBus.$emit("payment-request-canceled", {
            st: "cancelled",
            rejectMsg: infoObj.msg
          });
        } else if (infoObj.type === "payment-request-completed") {
          console.warn(
            "Payment-request COMPLETE message received in channel: ",
            msg
          );
          if (this.$isClientAppRole) {
            EventBus.$emit("payment-request-completed");
          } else {
            await this.notifyPaymentReceived(
              infoObj.amount,
              infoObj.something,
              infoObj.customer
            );
          }
        } else {
          console.warn("An unknown message was present in queue: ", msg);
        }
      }
      setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
    }
  },
  mounted() {
    EventBus.$on("suscribe-channel", this.onSuscribeToChannel);
    EventBus.$on("desuscribe-channel", this.onSuscribeToChannel);
  },
  destroyed() {
    //EventBus.$off("suscribe-channel", this.onSuscribeToChannel);
    //EventBus.$off("desuscribe-channel", this.onSuscribeToChannel);
  }
};
</script>
