<template>
  <div class="main-app">
    <div class="row">
      <div class="column">
        <AeQRCode v-bind:value="getAddress" />
      </div>
      <div class="column">
        <AeText fill="secondary">Channel Funds</AeText>
        <ae-amount v-bind:value="getMyBalance" unit="Æ" size="med" />
      </div>
    </div>
    <div class="row">
      <AeButton face="round" fill="primary" extend @click="deposit()">Deposit Funds</AeButton>
    </div>
    <div class="row">
      <AeButton face="round" fill="primary" extend @click="scanTxQr()">Scan Purchase Qr</AeButton>
    </div>
    <div class="row">
      <AeButton face="round" fill="primary" extend @click="closeChannel()">Close Channel</AeButton>
    </div>
    <div class="row">
      <AeButton face="round" fill="primary" extend @click="history()">History</AeButton>
    </div>
  </div>
</template>

<script>
import {
  AeText,
  AeQRCode,
  AeAmount,
  AeButton
} from "@aeternity/aepp-components";

import ChannelNotify from "../components/ChannelNotify";

export default {
  name: "MainMenu",
  components: {
    AeText,
    AeQRCode,
    AeAmount,
    AeButton,
    ChannelNotify
  },
  computed: {
    getAddress: function() {
      return this.$store.getters.initiatorId;
    },
    getMyBalance: function() {
      return this.$store.state.initiatorBalance / 10 ** 18;
    }
  },
  methods: {
    deposit: function() {
      this.$router.push("deposit");
    },
    scanTxQr: function() {
      this.$router.push({ name: "scanqr", params: { subview: "scantxqr" } });
    },
    closeChannel: function() {
      this.$router.push("channelClose");
    },
    history: function() {
      this.$router.push("history");
    }
  },
  mounted() {
    // Report error !
    this.$store.dispatch("updateChannelBalances").catch(err => {
      console.log("error getting balances! " + err);
    });
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