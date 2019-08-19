<template>
  <div></div>
</template>

<script>
/* eslint-disable no-console */
const POLL_INTERVAL_MS = 100;
import "sweetalert2/dist/sweetalert2.min.css";
import BigNumber from "bignumber.js";
import { EventBus } from "../event/eventbus";
import HubConnection from "../controllers/hub";

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
          customerName + ( (something !== "")
            ? " in concept of " + something
            : "") +
          ". This payment will be accredited in your In-hub balance"
      });
      await this.$store.dispatch("updateHubBalance");
    },
    onSuscribeToChannel() {
      console.warn("ChannelNotify: Received request to suscribe to Channel");
      this.$store.state.aeternity.setUpdateHandler(this.onChannelUpdateAck);
      this.$store.state.aeternity.setAfterUpdateAckSignHandler(
        this.onAfterUpdateAckSign
      );
      this.$store.state.channel.on("statusChanged", this.onChannelStatusChange);
      this.$store.state.channel.on("message", this.onChannelMessage);
      setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
    },
    onDesuscribeToChannel() {
      console.warn("ChannelNotify: Received request to desuscribe to Channel");
      this.$store.state.aeternity.setUpdateHandler(null);
      this.$store.state.aeternity.setAfterUpdateAckSignHandler(null);
      this.$store.state.channel.on("statusChanged", null);
      this.$store.state.channel.on("message", null);
    },
    onChannelStatusChange() {},
    onChannelMessage(msg) {
      console.log("PoS Message received: ", msg);
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
          console.warn("Heartbeat message received in channel");
          this.$store.state.channel.sendMessage(
            "heartbeat-ack",
            this.$store.getters.responderAddress
          );
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
  destroyed() {}
};
</script>
