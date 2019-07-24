<template>
  <div class="channel-open">
    <AeText>Please wait, {{ channelStatus }}</AeText>
    <AeLoader />
  </div>
</template>

<script>
const STATUS_INITIAL = 0,
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
      channelStatus: "initializing...",
      viewStatus: STATUS_INITIAL,
      errorText: null
    };
  },
  watch: {},
  computed: {},
  methods: {
    setErrorStatus(reason) {
      this.viewStatus = STATUS_ERROR;
      this.errorText = reason;
    },
    onChannelStatusChange(status) {
      this.channelStatus = status;
    }
  },
  mounted: async function() {
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