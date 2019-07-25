<template>
  <div class="channel-open">
    <AeText>{{ getChannelStatusDescriptiveText }}</AeText>
    <AeLoader v-show="isWorking" />
  </div>
</template>

<script>
const STATUS_INITIAL = 0,
  STATUS_WORKING = 1,
  STATUS_STOPPED = 2,
  STATUS_ERROR = 0xffff;

import { AeText, AeLoader } from "@aeternity/aepp-components";

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
      viewStatus: STATUS_INITIAL,
      errorText: null
    };
  },
  watch: {},
  computed: {
    getChannelStatusDescriptiveText() {
      switch (this.channelStatus) {
        case "disconnected":
          return "Channel has been disconnected!";
          break;
        case "accepted":
          return "Channel connection accepted";
          break;
        case "half-signed":
          return "Channel opening transaction half-signed";
          break;
        case "signed":
          return "Channel opening transaction signed by both parties";
          break;
        case "open":
          return "Channel successfully opened";
          break;
        default:
          return "Working...";
      }
    },
    isWorking() {
      return this.viewStatus === STATUS_WORKING;
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
        this.$router.replace({
          name: "success",
          params: { txKind: "initial-deposit" }
        });
      } else if (status === "disconnected") {
        this.viewStatus = STATUS_STOPPED;
      }
    }
  },
  mounted: async function() {
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
};
</script>

<style>
</style>