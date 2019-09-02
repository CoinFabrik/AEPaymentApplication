<template>
  <div class="channel-open">
    <LoadingModal
      always-visible
      :text="this.getChannelStatusDescriptiveText"
    />
  </div>
</template>

<script>
/* eslint-disable no-console */

const STATUS_ACK_HUB = 1,
  STATUS_WORKING = 2,
  STATUS_STOPPED = 3;

import HubConnection from "../controllers/hub";
import aeternity from "../controllers/aeternity";
import BigNumber from "bignumber.js";
import { DisplayUnitsToAE } from "../util/numbers";

export default {
  name: "ChannelOpen",
  props: {},
  data() {
    return {
      channelStatus: null,
      viewStatus: STATUS_STOPPED,
      errorText: null
    };
  },
  computed: {
    getChannelStatusDescriptiveText() {
      if (this.viewStatus === STATUS_ACK_HUB) {
        return "Communicating with hub...";
      } else if (this.viewStatus === STATUS_WORKING) {
        switch (this.channelStatus) {
          case "accepted":
            return "Channel connection accepted";
          case "half-signed":
            return "Please wait while the transaction is signed by the server...";
          case "signed":
            return "Channel opening transaction signed by both parties";
          case "open":
            return "Channel successfully opened";
          default:
            return "Working...";
        }
      } else if (this.viewStatus === STATUS_STOPPED) {
        if (this.channelStatus === "disconnected") {
          return "Channel has been disconnected!";
        } else return "Stopped.";
      } else return "Unknown state";
    },
    isWorking() {
      return this.viewStatus === STATUS_WORKING;
    },
    isAckHub() {
      return this.viewStatus === STATUS_ACK_HUB;
    },
    isStopped() {
      return this.viewStatus === STATUS_STOPPED;
    }
  },
  watch: {},
  mounted: async function() {
    try {
      let res = await this.notifyHub();
      console.log("res: ", res);

      if (!res.success) {
        this.$displayError(
          "Oops! There is some problem",
          "We could not communicate with the payment hub. Please try again later. Reason: " +
            res.error.toString()
        );
        this.$router.replace({
          name: "deposit",
          params: { initialDeposit: true }
        });
      } else {
        console.log("Hub Wallet Address: " + res.address);
        this.$store.commit("loadHubAddress", res.address);

        await this.createChannel();
      }
    } catch (e) {
      this.$displayError(
        "Oops! There is some problem",
        "We could not communicate with the payment hub. Please try again later. Reason: " +
          e.toString()
      );
      this.$router.replace({
        name: "deposit",
        params: { initialDeposit: true }
      });
    }
  },
  mounted: async function() {
    window.eventBus.$on("channel-status-changed", this.onChannelStatusChange);

    try {
      let res = await this.notifyHub();
      console.log("res: ", res);

      if (!res.success) {
        this.$displayError(
          "Oops! There is some problem",
          "We could not communicate with the payment hub. Please try again later. Reason: " +
            res.error.toString()
        );
        this.$router.replace({
          name: "deposit",
          params: { initialDeposit: true }
        });
      } else {
        console.log("Hub Wallet Address: " + res.address);
        console.log("Hub Node:  http" + res.node);
        this.$store.commit("loadHubAddress", res.address);
        this.$store.commit("loadHubNode", res.node);
        await this.$store.dispatch("storeChannelOptions", res.options);
        await this.createChannel();
      }
    } catch (e) {
      this.$displayError(
        "Oops! There is some problem",
        "We could not communicate with the payment hub. Please try again later. Reason: " +
          e.toString()
      );
      this.$router.replace({
        name: "deposit",
        params: { initialDeposit: true }
      });
    }
	},
  beforeDestroy() {
    window.eventBus.$off("channel-status-changed", this.onChannelStatusChange);
  },
  methods: {
    onChannelStatusChange(status) {
      console.log("Channel status change [" + status + "]");
      this.channelStatus = status;
      if (status === "open") {
        this.$store.commit("setOnboardingDone", true);

        this.$swal({
          type: "success",
          title: "Success",
          text: this.$isMerchantAppRole
            ? "Every time you get paid, the money will be addressed to your channel. Once you close it, all the funds will be withdrawn to your wallet."
            : "Now your channel balance is " +
              DisplayUnitsToAE(this.$store.state.initiatorAmount) +
              " AE. You can deposit more AEs when needed."
        }).then(this.$router.replace("main-menu"));
      } else if (status === "disconnected") {
        this.viewStatus = STATUS_STOPPED;
      }
    },
    async notifyHub() {
      this.viewStatus = STATUS_ACK_HUB;
      let hub = new HubConnection(
        this.$store.state.hubUrl,
        await aeternity.getAddress()
      );

      return hub.notifyUserOnboarding(
        this.$store.state.initiatorAmount,
        this.$store.state.userName,
        this.$isClientAppRole ? "client" : "merchant"
      );
    },
    async createChannel() {
      this.viewStatus = STATUS_WORKING;
      try {
        if (this.$store.state.channel == null) {
          await this.$store.dispatch("createChannel");
        } else {
          console.error("createChannel: Channel already created!");
        }

        // Channel created -- if we are merchants  suscribe to global
        // payment received notification.

        if (this.$isMerchantAppRole) {
          window.eventBus.$on("payment-complete-ack", e => {
            console.log("Received COMPLETE ",e);
            if (e.eventdata === "completed") {
              this.$swal.fire({
                text:
                  "Payment of " +
                  DisplayUnitsToAE(e.info.amount) +
                  " AE received from " +
                  e.info.customer_name,
                toast: true,
                position: "top"
              });
            }
          });
        }
      } catch (e) {
        this.$displayError(
          "Oops! There is some problem",
          "We cannot open the channel to the Payment Hub. Please try again in a moment. Reason: " +
            e.toString()
        );
        this.$router.replace({
          name: "deposit",
          params: { initialDeposit: true }
        });
      }
    }
  }
};
</script>

<style>
</style>