<template>
  <b-container
    id="deposit"
    class="content"
  >
    <AeText
      weight="bold"
      face="sans-l"
    >
      Deposit
    </AeText>
    <AeDivider style="margin-top:20px; margin-bottom:20px;" />
    <div v-if="initialDeposit">
      <div v-if="$isClientAppRole">
        <AeText face="sans-s">
          Please enter an amount of AE to deposit for channel open.
        </AeText>
        <AeText face="sans-s">
          You can add more tokens later
        </AeText>
      </div>

      <div v-if="$isMerchantAppRole">
        <AeText
          weight="500"
          face="sans-s"
        >
          To open a channel, you have to place a {{ merchantInitialDepositAE }} guarantee deposit. (*)
        </AeText>
        <br>
        <AeText
          face="sans-s"
          weight="700"
        >
          This deposit will be reimbursed once you close this channel.
        </AeText>
      </div>
    </div>
    <div v-else>
      <div v-if="$isClientAppRole">
        <AeText>How many tokens do you want to deposit in the PoS channel?</AeText>
      </div>
    </div>

    <ae-amount-input
      v-show="$isClientAppRole"
      v-model="depositInput"
      placeholder="0.00"
      style="margin-bottom:2px !important;"
      :units="[
        { symbol: 'AE', name: 'æternity' }
      ]"
      :disabled="isQueryingBalance"
      @input="onAmountInput"
    />
    <div v-if="isQueryingBalance">
      <AeText face="mono-xs">
        Please wait while Checking your account balance
      </AeText>
      <AeLoader />
    </div>
    <div v-else>
      <AeText
        v-show="$isClientAppRole"
        face="mono-xs"
      >
        (*) Transaction fee: {{ estimatedFeeAE }}
      </AeText>
    </div>
    <br>
    <AeButton
      face="round"
      fill="primary"
      class="margin"
      extend
      :disabled="depositInput.amount <= 0 || isQueryingBalance"
      @click="deposit()"
    >
      Deposit
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
    <AeText
      face="mono-xs"
      weight="500"
    />
  </b-container>
</template>

<script>
/* eslint-disable no-console */

const STATUS_USER_INPUT = 0,
  STATUS_QUERY_BALANCE = 1;

import {
  AeText,
  AeAmountInput,
  AeLoader,
  AeButton,
  AeDivider
} from "@aeternity/aepp-components";

import BigNumber from "bignumber.js";
import aeternity from "../controllers/aeternity";

export default {
  name: "Deposit",
  components: { AeButton, AeText, AeLoader, AeAmountInput, AeDivider },
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
    merchantInitialDepositAE() {
      return parseInt(process.env.VUE_APP_MERCHANT_INITIAL_DEPOSIT) / 10 ** 18;
    },
    balance() {
      return this.$store.state.balance;
    },
    isWaitingUserInput() {
      return this.viewState == STATUS_USER_INPUT;
    },
    isQueryingBalance() {
      return this.viewState == STATUS_QUERY_BALANCE;
    },
    estimatedFee() {
      return aeternity.estimateDepositFee(500000);
    },
    estimatedFeeAE() {
      return this.estimatedFee / 10 ** 18;
    }
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    setWaitingInputState() {
      this.viewState = STATUS_USER_INPUT;
    },
    async deposit() {
      console.log("Setting status to STATUS_QUERY_BALANCE");
      this.viewState = STATUS_QUERY_BALANCE;
      try {
        await this.$store.dispatch("updateOnchainBalance");
        console.log("balance: " + this.$store.state.balance);

        const balanceBN = new BigNumber(this.$store.state.balance);
        let inputBN;
        if (this.$isClientAppRole) {
          inputBN = new BigNumber(this.depositInput.amount);
          inputBN = inputBN.multipliedBy(new BigNumber(10).exponentiatedBy(18));
        } else if (this.$isMerchantAppRole) {
          inputBN = new BigNumber(process.env.VUE_APP_MERCHANT_INITIAL_DEPOSIT);
        }

        const estimatedFeeBN = new BigNumber(this.estimatedFee);

        if (balanceBN.lt(inputBN.plus(estimatedFeeBN))) {
          await this.$displayError(
            "Oops!",
            "Cannot continue. You have not enough funds to cover deposit amount, plus fees."
          );
          console.log("Setting not enough funds error state");

          this.viewState = STATUS_USER_INPUT;
        } else {
          if (this.initialDeposit) {
            this.$store.commit("setInitialDeposit", inputBN.toFixed(0));
            this.$router.push("channelopen");
          } else {
            this.$router.push({
              name: "confirm-tx",
              params: {
                txKind: "deposit",
                amountAettos: inputBN.toFixed(0),
                fee: estimatedFeeBN.toFixed(0)
              }
            });
          }
        }
      } catch (e) {
        await this.$displayError("Oops!", e.toString());
        this.viewState = STATUS_USER_INPUT;
      }
    },
    onAmountInput(v) {
      this.depositInput = v;
    }
  }
};
</script>

<style>
.content {
  position: relative;
  height: 80%;
}
.button {
  position: absolute;
  bottom: 0px;
  align-self: center;
}
</style>
