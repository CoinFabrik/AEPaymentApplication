<template>
  <div class="confirm-tx">
    <AeText
      align="center"
      v-if="txKind === 'deposit'"
    >Please review and confirm your CHANNEL DEPOSIT transaction</AeText>
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
      <AeText align="left" weight="bold" fill="alternative">Fee</AeText>
      <AeText align="left" face="sans-s">{{ feeAE }} AE</AeText>
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
    <ae-button-group>
      <AeButton face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
      <AeButton face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
    </ae-button-group>
  </div>
</template>

<script>
import {
  AeText,
  AeAmountInput,
  AeButtonGroup,
  AeButton,
  AePanel,
  AeDivider,
  AeCard,
  AeAddress,
  AeSwitch
} from "@aeternity/aepp-components";

import BigNumber from 'bignumber.js'

export default {
  name: "ConfirmTx",
  components: {
    AeButton,
    AeText,
    AeAmountInput,
    AeButtonGroup,
    AePanel,
    AeDivider,
    AeCard,
    AeAddress,
    AeSwitch
  },
  props: {
    txKind: String, // decide following fields based on txKind?
    amountAettos: String,
    fee: String
  },
  data() {
    return {
      depositAmount: {
        amount: "0",
        fee: "0"
      }
    };
  },
  computed: {
    amountAE() { 
      const BN =  new BigNumber(this.amountAettos).dividedBy(10**18);
      return BN.toString();
    },
    feeAE() {
      const BN = new  BigNumber(this.fee).dividedBy(10**18);
      return BN.toString();
    }
  },
  methods: {
    cancel() {
      this.$router.goBack();
    },
    confirm() {
      this.$router.replace({
        name: "commit-and-wait-tx",
        params: { txKind: this.txKind, txParams: { amountAettos: this.amountAettos } }
      });
    }
  }
};
</script>

<style>
div#tx_confirm_panel {
  margin-bottom: 8px;
}
</style>