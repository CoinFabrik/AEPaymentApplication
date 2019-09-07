<template>
  <b-container class="connectToWallet">
    <div
      v-if="isAtInitialState"
      class="content"
    >
      <ViewTitle title="Connect your wallet" />
      <ViewDescription
        first="This payments application must be connected to your wallet."
        customer="You will be able to fund the channel and then make payments. You will be asked to confirm every transaction."
        merchant="You will be able to withdraw the AEs you receive and pay fees when needed. You will be asked to confirm every transaction."
      />
      <ViewButtonSection :buttons="[{name: 'Sure!', action: connectToBaseApp}]" />
    </div>
    <LoadingModal />
  </b-container>
</template>

<script>
/* eslint-disable no-console */
import aeternity from "../controllers/aeternity.js";

const STATUS_OFFLINE = 0,
  STATUS_INIT = 0,
  STATUS_CONNECTING = 1,
  STATUS_CONNECTED = 2;

export default {
  name: "ConnectToWallet",
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
  mounted() {
  },
  methods: {
    async connectToBaseApp() {
      // if (window.parent.location.href !== "https://base.aepps.com") {
      //   this.$swal.fire({
      //     type: "info",
      //     text: "Please open this application in the Æternity Base æpp Browser"
      //   });
      //   return;
      // }
      let connectStatus = null;
      this.status = STATUS_CONNECTING;
      this.$bvModal.show("loadingModal");
      try {
        connectStatus = await aeternity.connectToBaseApp();
        if (connectStatus.status) {
          console.log("Aepp connect status Success");
          this.status = STATUS_CONNECTED;
          this.$bvModal.hide("loadingModal");

          const myAddress = await aeternity.client.address();
          aeternity.client
            .balance(myAddress)
            .then(() => {
              this.$router.push({
                name: "scanqr",
                params: { subview: "onboarding" }
              });
            })
            .catch(() => {
              this.$swal.fire({
                type: "warning",
                title: "No funds",
                text:
                  "Your selected account does not have any funds! Please login with a positive balance."
              });
              this.status = STATUS_INIT;
            });
        } else {
          this.$displayError(
            "Oops! We could not connect to your wallet",
            connectStatus.error.toString()
          );
          this.status = STATUS_INIT;
          this.$bvModal.hide("loadingModal");
        }
      } catch (e) {
        this.$displayError(
          "Oops! We could not connect to your wallet",
          e.toString()
        );
        this.status = STATUS_INIT;
        this.$bvModal.hide("loadingModal");
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
  height: 100%;
}
.button {
  position: absolute !important;
  bottom: 0px !important;
  left: 0px !important;
}
.divider {
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
