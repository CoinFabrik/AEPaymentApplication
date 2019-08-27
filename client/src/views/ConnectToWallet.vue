<template>
  <b-container class="connectToWallet">
    <div
      v-if="isAtInitialState"
      class="content"
    >
      <AeText
        face="sans-l"
        weight="600"
      >
        Authorization
      </AeText>
      <br>
      <AeDivider />
      <br>
      <AeText
        weight="500"
        face="sans-s"
      >
        This payments application must be connected to your wallet.
      </AeText>
      <AeText
        weight="400"
        face="sans-xs"
      >
        You will be able to withdraw the AEs you receive and pay fees when needed.
      </AeText>
      <AeText
        weight="400"
        face="sans-xs"
      >
        You will be asked to confirm every transaction.
      </AeText>
      <br>
      <AeButton
        face="round"
        fill="primary"
        class="button"
        extend
        @click="connectToBaseApp()"
      >
        Connect your wallet
      </AeButton>
    </div>
    <div v-if="isConnecting">
      <AeText>Please wait...</AeText>
      <AeLoader />
    </div>
  </b-container>
</template>

<script>
/* eslint-disable no-console */
import aeternity from "../controllers/aeternity.js";
import {
  AeText,
  AeButton,
  AeLoader,
  AeDivider
} from "@aeternity/aepp-components";

const STATUS_OFFLINE = 0,
  STATUS_INIT = 0,
  STATUS_CONNECTING = 1,
  STATUS_CONNECTED = 2;

export default {
  name: "ConnectToWallet",
  components: { AeButton, AeLoader, AeText, AeDivider },
  data() {
    return {
      status: STATUS_OFFLINE,
      error: null
    };
  },
  computed: {
    isOffline() {
      return this.status == STATUS_OFFLINE;
    },
    isAtInitialState() {
      return this.status == STATUS_INIT;
    },
    isConnecting() {
      return this.status == STATUS_CONNECTING;
    },
    isConnected() {
      return this.status == STATUS_CONNECTED;
    }
  },
  mounted() {
    // Preflight checks
    if (process.env.VUE_APP_ROLE === "merchant") {
      console.warn("Booting application with role:  MERCHANT");
    } else if (process.env.VUE_APP_ROLE === "client") {
      console.warn("Booting application with role:  CLIENT");
    } else {
      console.error("Cannot find application role in VUE_APP_ROLE variable");
      this.$displayError(
        "Unexpected error",
        "Application cannot start. Set proper application role to either MERCHANT or CLIENT"
      );
    }
    // Let's check if we were previously onboarded on refresh cases.

    if (this.$store.state.onboardingDone) {
      if (
        this.$store.state.channelReconnectInfo === null ||
        this.$store.state.channelReconnectInfo.channelId === null ||
        this.$store.state.channelReconnectInfo.offchainTx === null
      ) {
        console.warn(
          "Reconnect-on-refresh: Onboarding done, but no channel reconnection information was available."
        );
      } else {
        console.log(
          "Reconnect-on-refresh: Onboarding already done. Reconnecting to Channel Id" +
            this.$store.state.channeReconnectInfo.channelId
        );
        this.$store.dispatch("reconnectChannel").then(channel => {
          "statusChanged", this.onChannelStatusChange;
          this.$router.replace("main-menu");
        });
      }
    }

    // Clear any previous state
    this.$store.dispatch("resetState");
  },
  methods: {
    async connectToBaseApp() {
      this.status = STATUS_CONNECTING;
      try {
        const connectStatus = await aeternity.connectToBaseApp();
        if (connectStatus.status) {
          console.log("Aepp connect status Success");
          this.$store.commit("setAeClient", aeternity.client);
          this.status = STATUS_CONNECTED;
          this.$router.push({
            name: "scanqr",
            params: { subview: "onboarding" }
          });
        } else {
          this.$displayError(
            "Oops! We could not connect to your wallet",
            connectStatus.error.toString()
          );
          this.status = STATUS_INIT;
        }
      } catch (e) {
        this.$displayError(
          "Oops! We could not connect to your wallet",
          e.toString()
        );
        this.status = STATUS_INIT;
      }
    }
  }
};
</script>

<style>
	.connectToWallet {
		height: 100%;
	}
	.content {
		position: relative;
		height: 90%;
	}
	.button {
		position: absolute !important;
		bottom: 0px !important;
		left: 0px !important;
	}
</style>
