<template>
  <b-container id="confirm-tx">
    <ViewTitle title="Deposit details" />

    <AeText
      v-if="txKind === 'withdraw'"
      align="center"
    >
      Please review and confirm your CHANNEL WITHDRAW transaction
    </AeText>
    <ViewTransaction
      :amount="amountAE"
      :fee="feeAE"
    />
    <ViewButtonSection
      :buttons="[{name:'Cancel', action: cancel, fill:'neutral'}, {name:'Confirm', action: confirm}]"
    />
  </b-container>
</template>

<script>
import BigNumber from "bignumber.js";

export default {
  name: "ConfirmTx",
  props: {
    txKind: String, // decide following fields based on txKind?
    amountAettos: String,
    fee: String
  },
  data() {
    return {};
  },
  computed: {
    amountAE() {
      const BN = new BigNumber(this.amountAettos).dividedBy(10 ** 18);
      return BN.toString();
    },
    feeAE() {
      const BN = new BigNumber(this.fee).dividedBy(10 ** 18);
      return BN.toString();
    }
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    confirm() {
      this.$router.replace({
        name: "commit-and-wait-tx",
        params: {
          txKind: this.txKind,
          txParams: { amountAettos: this.amountAettos }
        }
      });
    }
  }
};
</script>

<style>
	#button-group {
		padding-top: 3vh;
	}
</style>
