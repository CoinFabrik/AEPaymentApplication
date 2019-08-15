<template>
  <b-container id="confirm-tx">
    <AeText
			weight="bold"
      align="center"
      v-if="txKind === 'deposit'"
    >Deposit detail</AeText>

    <AeText
      align="center"
      v-if="txKind === 'withdraw'"
    >Please review and confirm your CHANNEL WITHDRAW transaction</AeText>
    <AePanel id="tx_confirm_panel" fill="secondary">
      <!--
      <AeText align="left" weight="bold" fill="alternative">TX Description</AeText>
      <AeText align="left" face="sans-s">{{ description }}xyz</AeText>
      <AeDivider />
      <AeText align="left" weight="bold" fill="alternative">Destination Address</AeText>
      <AeText align="left" face="sans-s">{{ destination }}xyz</AeText>
      <AeDivider />
      -->
      <AeText align="left" weight="bold" fill="alternative">Amount</AeText>
      <AeText align="left" face="sans-s">{{ amountAE }} AE</AeText>
      <AeDivider />
      <AeText v-show="fee != '' " align="left" weight="bold" fill="alternative">Fee</AeText>
      <AeText v-show="fee != '' " align="left" face="sans-s">{{ feeAE }} AE</AeText>
      <!--
        <AeDivider />
      <AeText align="left" weight="bold" fill="alternative">Transaction Priority</AeText>

      <AeSwitch
        style="font-family: sans-serif;"
        name="tx_prio"
        :choices="[
                { label: 'NORMAL', value: 'normal' },
                { label: 'HIGH', value: 'high' },
                { label: 'TOP', value: 'top' }
                ]"
      -->
    </AePanel>
		<div id="button-group">
			<b-row align-h="center" class="xs-1">
				<AeButton face="round" fill="primary" @click="confirm()">Confirm</AeButton>
			</b-row>
			<b-row align-h="center" >
				<AeButton face="round" fill="negative" @click="cancel()">Cancel</AeButton>
			</b-row>
		</div>
  </b-container>
</template>

<script>
import {
  AeText,
  AeButton,
  AePanel,
  AeDivider
} from "@aeternity/aepp-components";

import BigNumber from "bignumber.js";

export default {
  name: "ConfirmTx",
  components: {
    AeButton,
    AeText,
    AePanel,
    AeDivider
  },
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
	#tx_confirm_panel {
	}
	#button-group {
		padding-top: 3vh;
	}
</style>