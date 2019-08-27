<template>
  <b-container class="main-app">
    <AeText
      fill="secondary"
      align="left"
      face="sans-s"
    >
      Wallet Balance
    </AeText>
    <ae-amount
      class="amount"
      align="left"
      :value="getMyWalletBalance.toFixed(2)"
      unit="Æ"
      size="small"
      clear="right"
    />

    <AeText
      fill="secondary"
      align="left"
      face="sans-s"
    >
      Channel Balance
    </AeText>
    <ae-amount
      class="amount"
      :value="$isMerchantAppRole ? (getMyChannelBalance + getMyPendingHubBalance).toFixed(2) : getMyChannelBalance.toFixed(2)"
      unit="Æ"
      size="small"
    />

    <AeDivider />
    <!-- Client Menu -->

    <div
      v-if="$isClientAppRole"
      class="button-group"
    >
      <AeButton
        class="margin"
        face="round"
        fill="primary"
        extend
        @click="deposit()"
      >
        Deposit Funds
      </AeButton>
      <AeButton
        class="margin"
        face="round"
        fill="primary"
        extend
        @click="scanTxQr()"
      >
        Pay With Qr Code
      </AeButton>
      <AeButton
        class="margin"
        face="round"
        fill="primary"
        extend
        @click="history()"
      >
        History
      </AeButton>
      <AeButton
        class="margin"
        face="round"
        fill="secondary"
        extend
        @click="closeChannelConfirmation()"
      >
        Close Channel
      </AeButton>
    </div>

    <!-- Merchant Menu -->

    <div
      v-if="$isMerchantAppRole"
      class="button-group"
    >
      <AeButton
        face="round"
        fill="primary"
        class="margin"
        extend
        @click="withdraw()"
      >
        Withdraw Funds
      </AeButton>

      <AeButton
        face="round"
        fill="primary"
        class="margin"
        extend
        @click="generatePaymentQr()"
      >
        Generate Payment Qr
      </AeButton>

      <AeButton
        face="round"
        fill="primary"
        class="margin"
        extend
        @click="history()"
      >
        History
      </AeButton>
      <AeButton
        face="round"
        fill="secondary"
        class="margin"
        extend
        @click="closeChannelConfirmation()"
      >
        Close Channel
      </AeButton>
    </div>
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import {
  AeText,
  AeAmount,
	AeButton,
	AeDivider
} from "@aeternity/aepp-components";
//import { setInterval } from "timers";

export default {
  name: "MainMenu",
  components: {
    AeText,
    AeAmount,
		AeButton,
		AeDivider
  },
  computed: {
    getAddress: function() {
      return this.$store.getters.initiatorId;
    },
    getMyChannelBalance: function() {
      return this.$store.state.initiatorBalance / 10 ** 18;
    },
    getMyWalletBalance: function() {
      return ((this.$store.state.balance / 10 ** 18) * 1.0);
    },
    getMyPendingHubBalance: function() {
      return ((this.$store.state.hubBalance / 10 ** 18) * 1.0);
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
			this.$router.replace({
        name: "commit-and-wait-tx",
        params: { txKind: "close" }
      });
		},
		closeChannelConfirmation: function() {
			this.$swal.fire({
				heightAuto: false,
				type: "question",
				title: "Are you sure you want to close this channel?",
				text: "Your funds in the channel will be transferred to your wallet.",
				showCancelButton: true,
				focusConfirm: false,
				confirmButtonText: 'Close',
				cancelButtonText: 'Cancel',
			}).then(({value}) => {
				if(value) {
					this.closeChannel();
				}
			});
		},
    history: function() {
      this.$router.push("history");
    }
  }
};
</script>

<style>
.row {
  display: flex;
  padding-bottom: 20px;
}
.button-group {
	margin-top:30px;
}
.column {
  flex: 50%;
}
.margin {
	margin-top: 10px;
}
.amount {
	font-weight: bold !important;
}
</style>