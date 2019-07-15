
<template>
  <div id="app">
    <AeMain>
      <img alt="Vue logo" src="./assets/ae2x.png" />
      <div>
        <ae-text fill="primary" face="sans-l">Aternity Universe</ae-text>
      </div>
      <ae-text fill="secondary" face="sans-base">Developers Conference</ae-text>
      <div v-if="isAtInitialState">
        <AeButton face="round" fill="primary" extend @click="connectToBaseApp()">Verify identity</AeButton>
      </div>
      <div v-if="isConnecting">
        <AeLoader />
      </div>
      <div v-if="isAtError">
        <ae-backdrop>{{ error }}</ae-backdrop>
      </div>
      <div v-if="isConnected">
        <ae-card fill="secondary" extend>
          <ae-address :value="my_address" />
        </ae-card>
          <AeButton face="round" fill="primary" extend @click="connectToBaseApp()">Buy Goods</AeButton>
          <AeButton face="round" fill="secondary" extend @click="connectToBaseApp()">Vote</AeButton>
          <AeButton face="round" fill="alternative" extend @click="connectToBaseApp()">Show QR</AeButton>
      </div>
    </AeMain>
  </div>
</template>
<script>
import Aepp from '@aeternity/aepp-sdk/es/ae/aepp';
import "@aeternity/aepp-components/dist/aepp.global.css";
import "@aeternity/aepp-components/dist/aepp.components.css";
import {
  AeMain,
  AeText,
  AeAddress,
  AeButton,
  AeCard,
  AeBackdrop,
  AeLoader
} from "@aeternity/aepp-components";

const STATUS_INIT = 0,
  STATUS_CONNECTING = 1,
  STATUS_CONNECTED = 2,
  STATUS_ERROR = 3;

export default {
  name: "app",
  components: {
    AeButton,
    AeMain,
    AeLoader,
    AeBackdrop,
    AeAddress,
    AeCard,
    AeText
  },
  data() {
    return {
      status: STATUS_INIT,
      error: null,
      myAddress: null,
      aeppObject: null
    };
  },
  computed: {
    isAtInitialState() { return this.status == STATUS_INIT },
    isConnecting() { return this.status == STATUS_CONNECTING },
    isConnected() { return this.status == STATUS_CONNECTED },
    isAtError() { return this.status == STATUS_ERROR }
  },
  methods: {
    async connectToBaseApp() {
      this.status = STATUS_CONNECTING;
      if (window.parent !== window) {
        try {     
          this.aepp = await Aepp();
          this.myAddress = this.aepp.address();
          //this.balance = await this.aeppt.balance(this.myaddress);
          this.status = STATUS_CONNECTED;
        } catch (error) {
          this.setError(error.toString());//'Please use this application from your mobile Base Aepp Wallet');
        }
      }
    },
    setError(errorText) {
      this.status = STATUS_ERROR;
      this.error = errorText;
    }
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
