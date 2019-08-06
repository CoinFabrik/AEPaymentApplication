<template>
  <div class="channel-open">
    <AeText>{{ getChannelStatusDescriptiveText }}</AeText>
    <AeLoader v-show="!isStopped" />
  </div>
</template>

<script>
const STATUS_INITIAL = 0,
  STATUS_ACK_HUB = 1,
  STATUS_WORKING = 2,
  STATUS_STOPPED = 3,
  STATUS_ERROR = 0xffff;

import { AeText, AeLoader } from "@aeternity/aepp-components";
import { EventBus } from "../event/eventbus.js";
import HubConnection from "../controllers/hub";

export default {
  name: "ChannelOpen",
  components: {
    AeText,
    AeLoader
  },
  props: {},
  data() {
    return {
      channelStatus: null,
      viewStatus: STATUS_STOPPED,
      errorText: null
    };
  },
  watch: {},
  computed: {
    getChannelStatusDescriptiveText() {
      if (this.viewStatus === STATUS_ACK_HUB) {
        return "Communicating with hub...";
      } else if (this.viewStatus === STATUS_WORKING) {
        switch (this.channelStatus) {
          case "accepted":
            return "Channel connection accepted";
          case "half-signed":
            return "Channel opening transaction half-signed";
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
      }
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
  methods: {
    setErrorStatus(reason) {
      this.viewStatus = STATUS_ERROR;
      this.errorText = reason;
    },
    onChannelStatusChange(status) {
      console.log("Channel status change [" + status + "]");
      this.channelStatus = status;
      if (status === "open") {
        // We can ask the global Channel notification component
        // to suscribe now.

        EventBus.$emit("suscribe-channel");

        this.$router.replace({
          name: "success",
          params: { txKind: "initial-deposit" }
        });
      } else if (status === "disconnected") {
        this.viewStatus = STATUS_STOPPED;
      }
    },
    async notifyHub() {
      this.viewStatus = STATUS_ACK_HUB;
      let hub = new HubConnection(
        this.$store.state.hubUrl,
        this.$store.getters.initiatorAddress
      );

      if (this.$isClientAppRole) {
        return hub.notifyClientOnboarding(this.$store.getters.initiatorAmount);
      } else if (this.$isMerchantAppRole) {
        return hub.notifyMerchantOnboarding(
          this.$store.getters.initiatorAmount,
          this.$store.state.merchantName
        );
      } else {
        throw new Error("Unknown application role!");
      }
    },
    async createChannel() {
      this.viewStatus = STATUS_WORKING;
      try {
        if (this.$store.state.channel == null) {
          await this.$store.dispatch("createChannel");
          this.$store.state.channel.on(
            "statusChanged",
            this.onChannelStatusChange
          );
        } else {
          console.log("mounted(): Channel already created!");
        }
      } catch (e) {
        console.error(e);
        this.$router.replace({
          name: "error",
          params: {
            errorTitle: "Error while opening channel",
            errorDescription: e.toString(),
            onRetryNavTo: { name: this.$router.currentRoute.name },
            onCancelNavTo: {
              name: "deposit",
              params: { initialDeposit: "true" }
            },
            retryCancel: true
          }
        });
      }
    }
  },
  mounted: async function() {
    try {
      let res = await this.notifyHub();
      if (!res.success) {
        throw "Error with the hub";
      }
    } catch (e) {
      alert("Hub error: " + e.toString());
      this.setErrorStatus("Hub error failure");
      return;
    }
    await this.createChannel();
  }
};
</script>

<style>
</style>