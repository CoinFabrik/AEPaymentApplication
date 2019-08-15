<template>
  <b-container class="main-app">

		<AeText fill="secondary" align="left" face="sans-s">Wallet Funds</AeText>
		<ae-amount align="left" v-bind:value="getMyWalletBalance" unit="Æ" size="small" clear="right" />

		<AeText fill="secondary" align="left" face="sans-s">Channel Funds</AeText>
		<ae-amount v-bind:value="getMyChannelBalance" unit="Æ" size="small" />

		<div v-show="$isMerchantAppRole">
			<AeText fill="secondary" face="sans-s">In Hub Funds</AeText>
			<ae-amount v-bind:value="getMyPendingHubBalance" unit="Æ" size="small" />
		</div>

		<!-- Client Menu -->

		<div class="button-group" v-if="$isClientAppRole">
				<AeButton class="button" face="round" fill="primary" extend @click="deposit()">Deposit Funds</AeButton>
				<AeButton class="button" face="round" fill="primary" extend @click="scanTxQr()">Pay With Qr Code</AeButton>
				<AeButton class="button" face="round" fill="primary" extend @click="history()">History</AeButton>
				<AeButton class="button" face="round" fill="secondary" extend @click="closeChannel()">Close Channel</AeButton>
		</div>

		<!-- Merchant Menu -->

		<div v-if="$isMerchantAppRole">

			<AeButton face="round" fill="primary" extend @click="withdraw()">Withdraw Funds</AeButton>

			<AeButton
				face="round"
				fill="primary"
				extend
				@click="generatePaymentQr()"
			>Generate Payment Qr</AeButton>

			<AeButton face="round" fill="primary" extend @click="closeChannel()">Close Channel</AeButton>

			<AeButton face="round" fill="primary" extend @click="history()">History</AeButton>
		</div>
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import {
  AeText,
  AeAmount,
  AeButton
} from "@aeternity/aepp-components";
//import { setInterval } from "timers";

export default {
  name: "MainMenu",
  components: {
    AeText,
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
.button-group {

}
.button {
	margin: 5px;
}
</style>