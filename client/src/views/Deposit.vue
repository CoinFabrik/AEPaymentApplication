<template>

	<b-container id="deposit">
		<div v-if="initialDeposit">
			<AeText weight="bold"> Initial Deposit </AeText>
		<!--
			<div v-if="$isClientAppRole">
				<AeText>
					To open a channel with our Point of Sale services an acquire
					venue amenities, goods and services,
					please enter an amount of AE to deposit. This amount can be
					used immediately. Unspent tokens will be returned to your wallet when the channel closes.
				</AeText>
				<AeText face="sans-s">You can add more tokens later</AeText>
			</div>

			<div v-if="$isMerchantAppRole">
				<AeText>
					To open a channel with our Point of Sale services you need
					to deposit {{ merchantInitialDepositAE }} AE plus a fee of {{ estimatedFeeAE }} AE as guarantee.
				</AeText>
				<AeText face="sans-s">This deposit will be returned to your wallet at channel close</AeText>
			</div>
		</div>
		<div v-else>

			<div v-if="$isClientAppRole">
				<AeText>How many tokens do you want to deposit in the PoS channel?</AeText>
			</div>
			-->
		</div>

		<ae-amount-input
			v-show="$isClientAppRole"
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
			<AeText
				face="sans-xs"
				v-show="$isClientAppRole"
			>Estimated Fee: {{ estimatedFee / (10**18) }} AE</AeText>
		</div>

		<AeButton
			face="round"
			fill="primary"
			extend
			@click="deposit()"
			:disabled="depositInput.amount <= 0 || isQueryingBalance"
		>Deposit</AeButton>
		<ae-modal v-if="isInError" @close="setWaitingInputState" title>
			<ErrorContent errorTitle="An error has occurred" v-bind:errorDescription="errorReason" />
		</ae-modal>
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
  AeButton
} from "@aeternity/aepp-components";

import BigNumber from "bignumber.js";

export default {
  name: "Deposit",
  components: {
    AeButton,
    AeText,
    AeLoader,
    AeAmountInput
  },
  props: {
    initialDeposit: Boolean
  },
  data() {
    return {
      viewState: STATUS_USER_INPUT,
      errorReason: null,
      depositInput: {
        amount: "",
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
      return this.$store.state.aeternity.estimateDepositFee(500000);
    },
    estimatedFeeAE() {
      return this.estimatedFee / 10 ** 18;
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
	#deposit {

	}
</style>
