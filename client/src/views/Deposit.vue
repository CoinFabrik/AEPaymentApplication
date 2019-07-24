<template>
  <div class="deposit">
    <div v-if="initialDeposit">
      <AeText>
        To open a channel with our Point of Sale services an acquire
        venue amenities, goods and services,
        please enter an amount of AE to deposit. This amount can be
        used immediately. Unspent tokens will be returned to your wallet when the channel closes.
      </AeText>
      <AeText face="sans-s">You can add more tokens later</AeText>
    </div>
    <div v-else>
      <AeText>How many tokens do you want to deposit in the PoS channel?</AeText>
    </div>
    <ae-amount-input
      placeholder="0.00"
      v-model="depositInput"
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
    <div v-else>
      <AeButton
        face="round"
        fill="primary"
        extend
        @click="deposit()"
        :disabled="depositInput.amount <= 0 || isInError || isQueryingBalance"
      >Deposit</AeButton>
    </div>

    <ae-modal v-if="isInError" @close="setWaitingInputState" title>
      <ErrorContent errorTitle="An error has occurred" v-bind:errorDescription="errorReason" />
    </ae-modal>
  </div>
</template>

<script>
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
  props: {
    initialDeposit: Boolean
  },
  data() {
    return {
      viewState: STATUS_USER_INPUT,
      errorReason: null,
      depositInput: {
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
    async deposit() {
      console.log("Setting status to STATUS_QUERY_BALANCE");
      this.viewState = STATUS_QUERY_BALANCE;
      try {
        await this.$store.dispatch("getCurrentBalance");

        const balanceBN = new BigNumber(this.$store.state.balance);
        let inputBN = new BigNumber(this.depositInput.amount);
        inputBN = inputBN.multipliedBy(10 ** 18);

        // TODO!  Consider fees (approximate? )

        console.log("balance: " + this.$store.state.balance);

        if (balanceBN.lt(inputBN)) {
          this.errorReason = "Not enough funds.";
          this.viewState = STATUS_ERROR;
          console.log("Setting not enough funds error state");
        } else {

          if (this.initialDeposit) {

            // Create and open a channel and subsequently deposit the provided amount

            this.$store.commit('setInitialDeposit', inputBN.toString());
            this.$router.push('channelopen');
          }
          // this.$router.push({
          //   name: "confirm-tx",
          //   params: {
          //     txKind: this.initialDeposit ? "initial-deposit" : "deposit",
          //   }
          // });

          this.viewState = STATUS_USER_INPUT;
        }
      } catch (e) {
        console.log(
          "Setting status to STATUS_ERROR with Text: " + e.toString()
        );
        this.errorReason = e.toString();
        this.viewState = STATUS_ERROR;
      }
    },
    onAmountInput(v) {
      this.depositInput = v;
    }
  }
};
</script>