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
   
    <ViewButtonSection
      v-if="$isMerchantAppRole"
      :buttons="[{name:'Request Payment', action: generatePaymentQr},{ name: 'My Activity', action: history},{name:'Close channel', action: popUpCloseModal, fill:'secondary'}]"
    />
    

    <CloseModal text="Close channel?" :on-confirm="this.closeChannel" />
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import BigNumber from "bignumber.js";
import { DisplayUnitsToAE } from "../util/numbers";
import HubConnection from "../controllers/hub";
import aeternity from "../controllers/aeternity";

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
    await this.refreshBalance();
  },
  methods: {
    refreshBalance: async function() {
      this.balanceLoading = true;
      try {
        await this.$store.dispatch("updateOnchainBalance");

        if (this.$isMerchantAppRole) {
          await this.$store.dispatch("updateHubBalance");
        }

        this.balanceLoading = false;
      } catch (e) {
        this.$displayError(
          "Oops",
          "We could not query your balances. Reason is " + e.toString()
        );
      }
    },
    popUpCloseModal: function() {
      this.$bvModal.show("closeModal");
    },
    withdraw: async function() {
      this.$swal.fire({
        text: "Verifying payment channel",
        allowOutsideClick: false,
        onBeforeOpen: () => {
          this.$swal.showLoading();
        }
      });
      if (await this.ensureReconnect()) {
        this.$router.push("withdraw");
      }
      this.$swal.close();
    },
    deposit: async function() {
      this.$swal.fire({
        text: "Verifying payment channel",
        allowOutsideClick: false,
        onBeforeOpen: () => {
          this.$swal.showLoading();
        }
      });
      if (await this.ensureReconnect()) {
        this.$router.push("deposit");
      }
      this.$swal.close();
    },
    scanTxQr: function() {
      this.$router.push({ name: "scanqr", params: { subview: "pay-with-qr" } });
    },
    generatePaymentQr: function() {
      this.$router.push("enterpurchase");
    },
    closeChannel: async function() {
      this.$swal.fire({
        text: "Verifying payment channel",
        allowOutsideClick: false,
        onBeforeOpen: () => {
          this.$swal.showLoading();
        }
      });
      if (await this.ensureReconnect()) {
        this.$router.replace({
          name: "commit-and-wait-tx",
          params: { txKind: "close" }
        });
      }
      this.$swal.close();
    },
    history: function() {
      this.$router.push("history");
    },
    ensureReconnect: async function() {
      let hub = new HubConnection(
        this.$store.state.hubUrl,
        await aeternity.getAddress()
      );
      let res = await hub.getPrevChannelId(process.env.VUE_APP_ROLE);
      if (!res.success) {
        this.$displayError(
          "Oops",
          "We could not get reconnection information from the hub. Please try again later"
        );
        return false;
      }

      if (res.channelId == null || res.channelId === "") {
        await this.$swal.fire({
          type: "error",
          html:
            "Sorry, but there's no existing payment channel available." +
            "<br>You will be redirected in order to fund a new payment channel.",
          onClose: async () => {
            await this.$store.dispatch("resetState");
            await this.$router.replace({
              name: "deposit",
              params: { initialDeposit: true }
            });
          }
        });
        return false;
      }

      console.log("Reconnection info is available. ChannelId=" + res.channelId);
      return true;
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
