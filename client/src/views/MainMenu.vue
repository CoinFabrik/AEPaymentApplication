<template>
  <b-container class="main-app">
    <ViewTitle title="Menu" />
    <ViewBalances
      :wallet-balance="getMyWalletBalance.toFixed(2)"
      :channel-balance="$isMerchantAppRole ? (getMyChannelBalance + getMyPendingHubBalance).toFixed(2) : getMyChannelBalance.toFixed(2)"
    />

    <ViewButtonSection
      v-if="$isClientAppRole"
      :buttons="[{name:'Deposit Funds', action: deposit},{name:'Scan A Payment Request', action: scanTxQr},{ name: 'My Activity', action: history}, {name:'Close channel', action:closeChannelConfirmation, cancel:true}]"
    />

    <ViewButtonSection
      v-if="$isMerchantAppRole"
      :buttons="[{name:'Withdraw Funds', action: withdraw},{name:'Generate QR Code', action: generatePaymentQr},{ name: 'My Activity', action: history}, {name:'Close channel', action:closeChannelConfirmation, cancel:true}]"
    />
  </b-container>
</template>

<script>
/* eslint-disable no-console */

export default {
  name: "MainMenu",
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