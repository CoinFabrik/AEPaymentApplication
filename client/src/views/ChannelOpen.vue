<template>
  <div class="channel-open">
    <ViewTitle title="Opening payment channel, please wait..." v-show="this.isWorking" />
    <br />
    <AeText v-show="this.isWorking" face="sans-s">{{ this.getChannelStatusDescriptiveText }}</AeText>
    <AeLoader v-show="this.isWorking" />

    <AeText face="sans-xs" v-show="this.txHash !== ''">
      <br />Channel creation TX Hash (click to copy)
      <b
        :style="{ color: hashColor }"
        @click="copyHash"
      >{{ this.prettyHash }}</b>
    </AeText>

    <div v-show="this.isWorking">
      <br />
      <AeText><b> Please do not close this app </b></AeText>
      <br />
      <AeButton
        face="round"
        extend
        fill="primary"
        @click="cancel"
        :disabled="this.channelStatus === 'opening-hub' || this.channelStatus === 'cancelling'"
      >Cancel</AeButton>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-console */
let hub = null;
import HubConnection from "../controllers/hub";
import aeternity from "../controllers/aeternity";
import BigNumber from "bignumber.js";
import { DisplayUnitsToAE } from "../util/numbers";
import { TxBuilder } from "@aeternity/aepp-sdk";
import copy from "copy-to-clipboard";
import { trimHash } from "../util/tools";
import NoSleep from 'nosleep'

let noSleep;

export default {
  name: "ChannelOpen",
  props: {},
  data() {
    return {
      channelStatus: "unknown",
      isWorking: false,
      userCancel: false,
      txHash: "",
      hashCopied: false
    };
  },
  computed: {
    getChannelStatusDescriptiveText() {
      if (this.isWorking) {
        switch (this.channelStatus) {
          case "opening-hub":
            return "Opening Hub...";
          case "connected":
            return "Channel connected";
          case "accepted":
            return "Channel connection accepted";
          case "half-signed":
            return "Please wait while the transaction is signed by the server...";
          case "signed":
            return "Channel opening transaction signed by both parties";
          case "open":
            return "Channel successfully opened";
          case "cancelling":
            return "Cancelling operation";
          default:
            return "Working...";
        }
      } else return "Unknown state";
    },
    hashColor() {
      return this.hashCopied ? "#e4416f" : "#000000";
    },
    prettyHash() {
      return this.txHash !== "" ? trimHash(this.txHash) : "";
    }
  },
  mounted: async function() {
    noSleep = new NoSleep();

    window.eventBus.$on("channel-status-changed", this.onChannelStatusChange);

    try {
      this.hub = new HubConnection(
        this.$store.state.hubUrl,
        await aeternity.getAddress()
      );
      this.isWorking = true;
      let res = await this.notifyHub();

      if (!res.success) {
        this.isWorking = false;
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
      this.isWorking = false;
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
    window.eventBus.$off("channel-onchain-tx", this.onChainTx);
    window.eventBus.$off("channel-status-changed", this.onChannelStatusChange);
  },
  methods: {
    async copyHash() {
      if (copy(this.txHash)) {
        this.hashCopied = true;
      }
    },
    async cancel() {
      this.channelStatus = "cancelling";
      this.userCancel = true;
      try {
        await this.$store.state.channel.disconnect();
        await aeternity.waitForChannelStatus(
          this.$store.state.channel,
          "disconnected",
          5000
        );
      } catch (e) {
        this.$swal.fire({
          type: "error",
          text: "Cancel operation failed. Reason is " + e.toString()
        });
      }

      this.$router.replace({
        name: "deposit",
        params: {
          initialDeposit: true
        }
      });
    },
    async onChainTx(tx) {
      this.txHash = TxBuilder.buildTxHash(tx);
      console.log("Obtained TX Hash: ", this.txHash);
    },
    onChannelDisconnected() {
      noSleep.disable();
      this.isWorking = false;

      if (this.userCancel) {
        return;
      }

      if (this.$store.state.channelOpenDone && this.$isOnDemandMode) {
        console.log("Ignoring handler (disconnect by on-demand LEAVE)");
        return;
      }

      this.$store.commit("setChannelOpenDone", false);

      // If we were connecting with stored state data, try to do it again
      // without it, if the user asks again.

      let strExisting =
        this.$store.state.channelOptions.hasOwnProperty("offchainTx") &&
        this.$store.state.channelOptions.hasOwnProperty("existingChannelId")
          ? "existing"
          : "new";

      this.$swal
        .fire({
          heightAuto: false,
          allowOutsideClick: false,
          showCancelButton: true,
          type: "error",
          title: "Oops",
          html:
            "We could not open your " +
            strExisting +
            " payment channel.<br>Do you want to try again?",
          confirmButtonText: "Retry",
          cancelButtonText: "Cancel"
        })
        .then(async result => {
          if (result.value) {
            this.isWorking = true;
            this.createChannel();
          } else if (result.dismiss === "cancel") {
            try {
              let res = await this.hub.resetConnectionData(
                process.env.VUE_APP_ROLE
              );
              if (!res.success) {
                throw "Call unsuccessful: " + res.error;
              }
            } catch (e) {
              console.error(
                "Failed to call endpoint to reset hub connection data: " +
                  e.toString()
              );
            }

            this.$router.replace({
              name: "deposit",
              params: {
                initialDeposit: true
              }
            });
          }
        });
    },
    onChannelOpen() {
      noSleep.disable();
      this.$store.commit("setChannelOpenDone", true);

      this.$store.dispatch("updateChannelBalances").then(() => {
        console.log(this.$store.state.initiatorBalance);
        this.$swal({
          type: "success",
          title: "Success",
          text: this.$isMerchantAppRole
            ? "Every time you get paid, the money will be addressed to your channel. Once you close it, all the funds will be withdrawn to your wallet."
            : "Now your channel balance is " +
              DisplayUnitsToAE(this.$store.state.initiatorBalance, { rounding: BigNumber.ROUND_UP }) +
              " AE. You can deposit more AEs when needed."
        }).then(this.$router.replace("main-menu"));
      });

      if (this.$isOnDemandMode) {
        this.$store.dispatch("leaveChannel");
      }
    },

    onChannelStatusChange(status) {
      console.log("Channel status change [" + status + "]");
      this.channelStatus = status;

      if (status === "disconnected") {
        this.onChannelDisconnected();
      } else if (status === "open") {
        this.onChannelOpen();
      }
    },
    async notifyHub() {
      this.channelStatus = "opening-hub";

      return this.hub.notifyUserOnboarding(
        this.$store.state.initiatorAmount,
        this.$store.state.userName,
        process.env.VUE_APP_ROLE
      );
    },
    async createChannel() {
      noSleep.enable();
      this.$store.commit("setChannelOpenDone", false);
      try {
        await this.$store.dispatch("createChannel");

        if (this.$isMerchantAppRole && !this.$isOnDemandMode) {
          // Channel created -- if we are merchants  suscribe to global
          // payment received toast notification on always-connected mode.
          //
          // On-demand mode payment receipt is done while QR is shown.
          // (see ShowPaymentQr.vue)
          this.suscribeMerchantPaymentEvent();
        }
        window.eventBus.$on("channel-onchain-tx", this.onChainTx);
      } catch (e) {
        noSleep.disable();
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
    },
    suscribeMerchantPaymentEvent() {
      window.eventBus.$on("payment-complete-ack", e => {
        console.log("Received COMPLETE ", e);
        if (e.eventdata === "completed") {
          this.$swal.fire({
            text:
              "Payment of " +
              DisplayUnitsToAE(e.info.amount, { rounding: BigNumber.ROUND_UP}) +
              " AE received from " +
              e.info.customer_name,
            toast: true,
            position: "top"
          });
        }
      });
    }
  }
};
</script>

<style>
</style>
