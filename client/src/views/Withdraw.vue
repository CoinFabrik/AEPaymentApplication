<template>
  <div class="withdraw">
    <AeText>How many AE do you want to withdraw from your channel funds?</AeText>
    <ae-amount-input
      v-model="withdrawInput"
      placeholder="0.00"
      :units="[
            { symbol: 'AE', name: 'æternity' }
          ]"
      v-bind:disabled="isQueryingBalance"
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

    <AeButton
      face="round"
      fill="primary"
      extend
      @click="withdraw()"
      :disabled="withdrawInput.amount <= 0 || isQueryingBalance"
    >Withdraw</AeButton>
  </div>
</template>

<script>
/* eslint-disable no-console */

const STATUS_USER_INPUT = 0,
  STATUS_QUERY_BALANCE = 1;

import {
  AeModal,
  AeText,
  AeAmountInput,
  AeLoader,
  AeButton
} from "@aeternity/aepp-components";

import BigNumber from "bignumber.js";

export default {
  name: "Withdraw",
  components: {
    AeModal,
    AeButton,
    AeText,
    AeLoader,
    AeAmountInput
  },
  props: {},
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