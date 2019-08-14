<template>
  <div class="main-app">
    <div class="row">
      <AeText fill="secondary" face="sans-s">Wallet Funds</AeText>
      <div class="column">
        <ae-amount v-bind:value="getMyWalletBalance" unit="Æ" size="small" clear="right" />
      </div>
    </div>

    <div class="row">
      <AeText fill="secondary" face="sans-s">Channel Funds</AeText>
      <div class="column">
        <ae-amount v-bind:value="getMyChannelBalance" unit="Æ" size="small" />
      </div>
    </div>

    <div class="row" v-show="$isMerchantAppRole">
      <AeText fill="secondary" face="sans-s">In Hub Funds</AeText>
      <div class="column">
        <ae-amount v-bind:value="getMyPendingHubBalance" unit="Æ" size="small" />
      </div>
    </div>

    <!-- Client Menu -->

    <div v-if="$isClientAppRole">
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="deposit()">Deposit Funds</AeButton>
      </div>
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="scanTxQr()">Pay With Qr Code</AeButton>
      </div>
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="closeChannel()">Close Channel</AeButton>
      </div>
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="history()">History</AeButton>
      </div>
    </div>

    <!-- Merchant Menu -->

    <div v-if="$isMerchantAppRole">
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="withdraw()">Withdraw Funds</AeButton>
      </div>
      <div class="row">
        <AeButton
          face="round"
          fill="primary"
          extend
          @click="generatePaymentQr()"
        >Generate Payment Qr</AeButton>
      </div>
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="closeChannel()">Close Channel</AeButton>
      </div>
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="history()">History</AeButton>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import {
  AeText,
  AeQRCode,
  AeAmount,
  AeButton
} from "@aeternity/aepp-components";
import { setInterval } from "timers";

export default {
  name: "MainMenu",
  components: {
    AeText,
    AeQRCode,
    AeAmount,
    AeButton
  },
  computed: {
    getAddress: function() {
      return this.$store.getters.initiatorId;
    },
    getMyChannelBalance: function() {
      return this.$store.state.initiatorBalance / 10 ** 18;
    },
    getMyWalletBalance: function() {
      return this.$store.state.balance / 10 ** 18;
    },
    getMyPendingHubBalance: function() {
      return this.$store.state.hubBalance / 10 ** 18;
    }
  },
  methods: {
    withdraw: function() {
      this.$router.push("withdraw");
    },
    deposit: function() {
      this.$router.push("deposit");
    },
    scanTxQr: function() {
      this.$router.push({ name: "scanqr", params: { subview: "pay-with-qr" } });
    },
    generatePaymentQr: function() {
      this.$router.push("enterpurchase");
    },
    closeChannel: function() {
      this.$router.push("channelClose");
    },
    history: function() {
      this.$router.push("history");
    }
  },
  async mounted() {
    // // Report error !
    // try {
    //   setInterval(() => {
    //     this.$store.dispatch("updateChannelBalances");
    //   }, 1000);
    // } catch (err) {
    //   console.log("error getting balances! " + err);
    // }
    try {
      await this.$store.dispatch("updateChannelBalances");
      await this.$store.dispatch("updateOnchainBalance");
      await this.$store.dispatch("updateHubBalance");
    } catch (e) {
      this.$displayError("Oops!", e.toString());
    }
  }
};
</script>

<style>
.row {
  display: flex;
  padding-bottom: 20px;
}

.column {
  flex: 50%;
}
</style>