<template>
    <div class="confirm-tx" >
    <AePanel fill="secondary">
        <AeText align="left" weight="bold" fill="alternative">TX Description</AeText>
        <AeText align="left" face="sans-s">{{ description }}xyz</AeText>
        <AeDivider />
        <AeText align="left" weight="bold" fill="alternative">Destination Address</AeText>
        <AeText align="left" face="sans-s">{{ destination }}xyz</AeText>
        <AeDivider />
        <AeText align="left" weight="bold" fill="alternative">Amount</AeText>
        <AeText align="left" face="sans-s">{{ amount }} 1 {{ symbol }}</AeText>
        <AeDivider />
        <AeText align="left" weight="bold" fill="alternative">Fee</AeText>
        <AeText align="left" face="sans-s">0.043 microAE</AeText>
        <AeDivider />
        <AeText align="left" weight="bold" fill="alternative">Transaction Priority</AeText>
        <AeSwitch  style="font-family: sans-serif;" name="tx_prio" :choices="[
            { label: 'NORMAL', value: 'normal' },
            { label: 'HIGH', value: 'high' },
            { label: 'TOP', value: 'top' }
            ]"/>

    </AePanel>
      <ae-button-group>
       <AeButton face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
       <AeButton face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
      </ae-button-group>
    </div>
</template>

<script>
import aeternity from '../controllers/network.js'
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
    description: String,
    destination: String,
    amount: String, 
    symbol: String
  },
  data() {
    return {
      depositAmount: {
        amount: "1",
        symbol: 'AE'
      }
    };
  },
  computed: {
   
  },
  methods: {
    cancel() {
      this.$router.go(-1);
    }
    // deposit() {
    //   this.$router.push('ConfirmTx');
    // }
  }
};
</script>