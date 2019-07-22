<template>
    <div class="connectToWallet" >
      <div v-if="isAtInitialState">
        <AeText>We need access to your wallet. Please click the button below to authorize this application</AeText>
        <AeButton face="round" fill="primary" extend @click="connectToBaseApp()">Connect your wallet</AeButton>
      </div>
      <div v-if="isConnecting">
        <AeText>Please wait...</AeText>
        <AeLoader />
      </div>
      <div v-if="isAtError">
          <ae-backdrop>{{ error }}</ae-backdrop>
      </div>
    </div>
</template>

<script>
import aeternity from '../controllers/network.js'
import {
  AeText,
  AeButton,
  AeCard,
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
    isOffline() { return this.status == STATUS_OFFLINE },
    isAtInitialState() { return this.status == STATUS_INIT },
    isConnecting() { return this.status == STATUS_CONNECTING },
    isConnected() { return this.status == STATUS_CONNECTED },
    isAtError() { return this.status == STATUS_ERROR }
  },
  methods: {
    async connectToBaseApp() {
      this.status = STATUS_CONNECTING;
      const connectStatus = await aeternity.connectToBaseApp();
      console.log(connectStatus);
      if (connectStatus.status) {
        this.status = STATUS_CONNECTED;
        this.$router.push( { name: 'scanqr', params: { subview: 'onboarding'}});
      } else {
        this.setError(connectStatus.error);
      }
    },
    setError(errorText) {
      this.status = STATUS_ERROR;
      this.error = errorText;
    }
  }
};
</script>