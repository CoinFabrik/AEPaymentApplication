<template>
  <div class="connectToWallet">
    <b-container>
      <b-col offset-md="4" md="4">
        <div v-if="isAtInitialState">
            <AeText weight="bold" face='sans-s'>We need access to your wallet. Please click the button below to authorize this application</AeText>
            <br>
            <AeButton face="round" fill="primary" @click="$bvModal.show('authorize-modal')">Connect your wallet</AeButton>
        </div>
        <div v-if="isConnecting">
          <AeText>Please wait...</AeText>
          <AeLoader />
        </div>
        <div v-if="isAtError">
          <ae-backdrop>{{ error }}</ae-backdrop>
        </div>
      </b-col>

      <b-modal id="authorize-modal" centered hide-footer hide-header>
        <div class="d-block text-center">
          <AeText weight="bold">Authorize access of this application to your account?</AeText>
        </div>
        <br>
        <b-row>
          <b-col>
            <AeButton face="round" fill="neutral" @click="$bvModal.hide('authorize-modal')">Deny</AeButton>
          </b-col>
          <b-col>
            <AeButton face="round" fill="primary" @click="connectToBaseApp(); $bvModal.hide('authorize-modal')">Allow</AeButton>
          </b-col>
        </b-row>
      </b-modal>

    </b-container>
  </div>
</template>

<style>
  .connectToWallet {
  }
</style>

<script>
/* eslint-disable no-console */
import aeternity from "../controllers/aeternity.js";
import {
  AeText,
  AeButton,
  AeBackdrop,
  AeLoader
} from "@aeternity/aepp-components";

const STATUS_OFFLINE = 0,
  STATUS_INIT = 0,
  STATUS_CONNECTING = 1,
  STATUS_CONNECTED = 2,
  STATUS_ERROR = 3;

export default {
  name: "ConnectToWallet",
  components: {
    AeButton,
    AeLoader,
    AeBackdrop,
    AeText
  },
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
    },
    isAtError() {
      return this.status == STATUS_ERROR;
    }
  },
  methods: {
    async connectToBaseApp() {

      this.status = STATUS_CONNECTING;
      try {
        const connectStatus = await aeternity.connectToBaseApp();
        console.log(connectStatus);
        if (connectStatus.status) {
          this.$store.commit("setAeObject", aeternity);
          this.status = STATUS_CONNECTED;
          this.$router.push({
            name: "scanqr",
            params: { subview: "onboarding" }
          });
        } else {
          this.setError(connectStatus.error.toString());
        }
      } catch (e) {
        this.setError(e.toString());
      }
    },
    setError(errorText) {
      this.$router.push({
        name: "error",
        params: {
          errorTitle: "We could not connect to your wallet",
          errorDescription: errorText,
          retryCancel: false
        }
      });
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
      this.setError(
        "Application cannot start. Set proper application role to either MERCHANT or CLIENT"
      );
    }
  }
};
</script>