<template>
  <b-container
    id="deposit"
    class="content"
  >
    <ViewTitle
      title="Fund your channel"
    />
    <div v-if="initialDeposit">
      <ViewDescription
        :first="'Your wallet balance is ' + balance + ' AEs'"
        :merchant="'To open a channel, you have to place a ' + merchantInitialDepositAE + ' AEs guarantee deposit. This deposit will be reimbursed once you close this channel.'"
        :customer="'Please enter the amount to deposit into your channel. You will be able to add more AEs later and to withdraw all your funds whenever you want.'"
      />
    </div>
    <div v-else>
      <div v-if="$isClientAppRole">
        <AeText>How much do you want to deposit in your channel?</AeText>
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
        Transaction fee: {{ estimatedFeeAE }} AEs
      </AeText>
    </div>
    <ViewButtonSection
      :buttons="[{name:'Deposit', action: deposit}, {name:'Cancel', action:cancel, cancel:true}]"
    />
  </b-container>
</template>

<script>
/* eslint-disable no-console */

const STATUS_USER_INPUT = 0,
  STATUS_QUERY_BALANCE = 1;
import BigNumber from "bignumber.js";
import aeternity from "../controllers/aeternity";

export default {
  name: "Deposit",
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
      return (BigNumber(this.$store.state.balance).dividedBy(10**18)).toFixed(2, BigNumber.ROUND_DOWN);
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
	},
	mounted() {
		this.$store.dispatch('updateOnchainBalance');
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
