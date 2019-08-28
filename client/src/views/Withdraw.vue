<template>
  <b-container class="withdraw">
    <AeText
      face="sans-l"
      weight="600"
    >
      Withdraw
    </AeText>
    <AeDivider style="margin-top:20px; margin-bottom:20px;" />
    <AeText
      face="sans-s"
      weight="500"
    >
      How many AE do you want to withdraw from your channel funds?
    </AeText>
    <ae-amount-input
      v-model="withdrawInput"
      placeholder="0.00"
      :units="[
        { symbol: 'AE', name: 'æternity' }
      ]"
      :disabled="isQueryingBalance"
    />
    <div v-if="isQueryingBalance">
      <AeText>Please wait while Checking your account balance</AeText>
      <AeLoader />
    </div>
    <!--
    <div v-else>
      <AeText face="sans-xs">Estimated Fee: {{ estimatedFee / (10**18) }} AE</AeText>
    </div>
    -->

    <div class="button-group">
      <AeButton
        face="round"
        fill="primary"
        class="margin"
        extend
        :disabled="withdrawInput.amount <= 0 || isQueryingBalance"
        @click="withdraw()"
      >
        Withdraw
      </AeButton>

      <AeButton
        face="round"
        fill="secondary"
        class="margin"
        extend
        @click="cancel()"
      >
        Cancel
      </AeButton>
    </div>
  </b-container>
</template>

<script>
/* eslint-disable no-console */

const STATUS_USER_INPUT = 0, STATUS_QUERY_BALANCE = 1;
import BigNumber from "bignumber.js";

export default {
  name: "Withdraw",
  data() {
    return {
      viewState: STATUS_USER_INPUT,
      withdrawInput: {
        amount: "0.00",
        symbol: "AE"
      }
    };
  },
  computed: {
    balance() {
      return this.$store.state.balance;
    },
    isWaitingUserInput() {
      return this.viewState == STATUS_USER_INPUT;
    },
    isQueryingBalance() {
      return this.viewState == STATUS_QUERY_BALANCE;
    }
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    setWaitingInputState() {
      this.viewState = STATUS_USER_INPUT;
    },
    async withdraw() {
      console.log("Setting status to STATUS_QUERY_BALANCE");
      this.viewState = STATUS_QUERY_BALANCE;
      try {
        await this.$store.dispatch("updateChannelBalances");
        console.log("channel balance: " + this.$store.state.initiatorBalance);

        const balanceBN = new BigNumber(this.$store.state.initiatorBalance);
        let inputBN = new BigNumber(this.withdrawInput.amount);
        inputBN = inputBN.multipliedBy(10 ** 18);

        if (balanceBN.lt(inputBN)) {
          this.$swal.fire({
            heightAuto: false,
            type: "info",
            text: "You cannot withdraw an amount exceeding channel balance"
          });
        } else {
          this.$router.push({
            name: "confirm-tx",
            params: {
              txKind: "withdraw",
              amountAettos: inputBN.toFixed(0),
              fee: ""
            }
          });
        }

        this.viewState = STATUS_USER_INPUT;
      } catch (e) {
        this.$displayError("Oops!", e.toString());
      }
    }
  }
};
</script>

<style>
	.button-group {
		margin-top: 40px;
	}
</style>
