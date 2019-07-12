
<template>
  <div id="app">
    <AeMain>
      <img alt="Vue logo" src="./assets/logo.png" />
      <HelloWorld msg="Welcome to Your Vue.js App" />
      <div v-if="status == STATUS_INIT">
        <AeButton face="round" fill="primary" extend @click="connectToBaseApp()">Verify identity</AeButton>
      </div>
      <div v-if="status == STATUS_CONNECTING">
        <AeLoader />
      </div>
      <div v-if="status == STATUS_ERROR">
        <ae-backdrop>
          {{ error }}
        </ae-backdrop>
      </div>
      <div v-if="status == STATUS_CONNECTED">
        <ae-card fill="secondary" extend>
          <ae-address :value="my_address" />
        </ae-card>
      </div>
    </AeMain>
  </div>
</template>
<script>
import "@aeternity/aepp-components/dist/aepp.global.css";
import "@aeternity/aepp-components/dist/aepp.components.css";
import { AeMain, AeAddress, AeButton, AeCard, AeBackdrop, AeLoader } from "@aeternity/aepp-components";

const STATUS_INIT = 0,
      STATUS_CONNECTING = 1,
      STATUS_CONNECTED = 2,
      STATUS_ERROR =  3

export default {
  name: "app",
  components: {
    AeButton,
    AeMain,
    AeLoader,
    AeBackdrop,
    AeAddress,
    AeCard
  },
  data() {
    return {
      status: STATUS_INIT,
      error: null,
      myaddress: null
    }
  },
  methods: {
    async connectToBaseApp() {
      if (window.parent !== window) {
        this.status = STATUS_CONNECTING;
        const success = await aeternity.initBase({
          id: 999, // verify all parameters.
          stakeHeight: 80541,
          endHeight: 80541
        });

        if (!success) {
          this.setError('Use this application from the Base Aepp only');
        }
        else {
          this.status = CONNECTED;
          this.myaddress = this.provider.

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
