<template>
  <b-container class="main-app">
    <ViewTitle :title="getName || 'Menu'" />
    <ViewBalances
      style="margin-top:4vh;"
      :wallet-balance="getMyWalletBalanceAE"
      :channel-balance="$isMerchantAppRole ? getTotalBalanceAE : getMyChannelBalanceAE"
      :loading="balanceLoading"
    />

    <ViewButtonSection
      v-if="$isClientAppRole" 
      :buttons="[{name:'Deposit Funds', action: deposit},{name:'Scan Payment Request', action: scanTxQr},{ name: 'My Activity', action: history}, {name:'Close channel', action: popUpCloseModal, fill:'secondary'}]"
    />
    <!--
    <ViewButtonSection
      v-if="$isClientAppRole && $isOnDemandMode"
      :buttons="[{name:'Scan Payment Request', action: scanTxQr},{ name: 'My Activity', action: history}, {name:'Close channel', action: popUpCloseModal, fill:'secondary'}]"
    />
    -->

    <ViewButtonSection
      v-if="$isMerchantAppRole && $isOnDemandMode"
      :buttons="[{name:'Request Payment', action: generatePaymentQr},{ name: 'My Activity', action: history},{name:'Close channel', action: popUpCloseModal, fill:'secondary'}]"
    />
    <ViewButtonSection
      v-if="$isMerchantAppRole && !$isOnDemandMode"
      :buttons="[{name:'Withdraw Funds', action: withdraw},{name:'Request Payment', action: generatePaymentQr}, { name: 'My Activity', action: history},{name:'Close channel', action: popUpCloseModal, fill:'secondary'}]"
    />

    <CloseModal text="Close channel?" :on-confirm="this.closeChannel" />
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import BigNumber from "bignumber.js";
import { DisplayUnitsToAE } from "../util/numbers";

export default {
  name: "MainMenu",
  data() {
    return { balanceLoading: true };
  },
  computed: {
    getName: function() {
      return this.$store.state.userName;
    },
    getAddress: function() {
      return this.$store.getters.initiatorId;
    },
    getTotalBalanceAE: function() {
      return DisplayUnitsToAE(
        BigNumber(this.$store.state.initiatorBalance).plus(
          this.$store.state.hubBalance
        ),
        { digits: 2, rounding: BigNumber.ROUND_DOWN }
      );
    },
    getMyChannelBalanceAE: function() {
      return DisplayUnitsToAE(BigNumber(this.$store.state.initiatorBalance), {
        digits: 2,
        rounding: BigNumber.ROUND_DOWN
      });
    },
    getMyWalletBalanceAE: function() {
      return DisplayUnitsToAE(this.$store.state.balance, {
        digits: 2,
        rounding: BigNumber.ROUND_DOWN
      });
    }
  },
  async mounted() {
    this.balanceLoading = true;
    try {
      await this.$store.dispatch("updateOnchainBalance");

      if (this.$isMerchantAppRole) {
        await this.$store.dispatch("updateHubBalance");
      }

      if (!this.$isOnDemandMode) {
        await this.$store.dispatch("updateChannelBalances");
      }

      this.balanceLoading = false;
    } catch (e) {
      this.$displayError(
        "Oops",
        "We could not query your balances. Reason is " + e.toString()
      );
    }
  },
  methods: {
    popUpCloseModal: function() {
      this.$bvModal.show("closeModal");
    },
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
  margin-top: 30px;
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
