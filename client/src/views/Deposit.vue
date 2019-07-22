<template>
    <div class="deposit" >
     <div v-if="initialDeposit">
       <AeText>To open a channel with our Point of Sale services an acquire
        venue amenities, goods and services, 
        please enter an amount of AE to deposit.  This amount can be 
        used immediately. Unspent tokens will be returned to your wallet xxx
        </AeText>
        <AeText face="sans-s">You can add more tokens later</AeText>
     </div>
     <div v-else>
       <AeText>How many tokens do you want to deposit in the PoS channel?</AeText>
     </div>
     <ae-amount-input
          placeholder="0.00"
          v-model="depositAmount"
          :units="[
            { symbol: 'AE', name: 'æternity' }
          ]"
        />
      <AeButton face="round" fill="primary" extend @click="deposit()">Deposit</AeButton>
    </div>
</template>

<script>
import {
  AeText,
  AeAmountInput,
  AeButton
} from "@aeternity/aepp-components";

export default {
  name: "Deposit",
  components: {
    AeButton,
    AeText,
    AeAmountInput
  },
  props: {
    initialDeposit: Boolean
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
    deposit() {
      this.$router.push({ name: 'confirm-tx', params: { txKind: this.initialDeposit ? 'initial-deposit' : 'deposit' }});
    }
  }
};
</script>