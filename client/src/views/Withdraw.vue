<template>
  <div class="withdraw">
    <AeText>How many AE do you want to withdraw from your channel funds?</AeText>
    <ae-amount-input
      placeholder="0.00"
      v-model="withdrawInput"
      :units="[
            { symbol: 'AE', name: 'æternity' }
          ]"
      @input="onAmountInput"
      v-bind:disabled="isInError || isQueryingBalance"
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
      :disabled="withdrawInput.amount <= 0 || isInError || isQueryingBalance"
    >Withdraw</AeButton>

    <ae-modal v-if="isInError" @close="setWaitingInputState" title>
      <ErrorContent errorTitle="An error has occurred" v-bind:errorDescription="errorReason" />
    </ae-modal>
  </div>
</template>

<script>
/* eslint-disable no-console */

const STATUS_USER_INPUT = 0,
  STATUS_QUERY_BALANCE = 1,
  STATUS_ERROR = 2;

import {
  AeModal,
  AeText,
  AeAmountInput,
  AeLoader,
  AeButton
} from "@aeternity/aepp-components";

import ErrorContent from "../components/ErrorContent";
import BigNumber from "bignumber.js";

export default {
  name: "Deposit",
  components: {
    AeModal,
    AeButton,
    AeText,
    AeLoader,
    AeAmountInput,
    ErrorContent
  },
  props: {},
  data() {
    return {
      viewState: STATUS_USER_INPUT,
      errorReason: null,
      withdrawInput: {
        amount: "1",
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
    },
    isInError() {
      return this.viewState == STATUS_ERROR;
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
          console.log("XXX");
          this.errorReason =
            "You cannot withdraw an amount exceeding channel balance";
          this.viewState = STATUS_ERROR;
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
        console.log(
          "Setting status to STATUS_ERROR with Text: " + e.toString()
        );
        this.errorReason = e.toString();
        this.viewState = STATUS_ERROR;
      }
    },
    onAmountInput(v) {
      this.withdrawInput = v;
    }
  }
};
</script>