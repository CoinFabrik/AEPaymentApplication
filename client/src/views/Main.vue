<template>
    <div class="confirm-tx" >
        <AeText align="center">Please wait for your transaction to be confirmed</AeText>
        <AeText align="center">{{ confirm.pct }} %</AeText>
        <AeLoader/>
    </div>
</template>

<script>
import aeternity from '../controllers/network.js'
import {
  AeText,
  AeLoader
} from "@aeternity/aepp-components";

export default {
  name: "Main",
  components: {
    AeText,
    AeLoader
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

<style>
div#tx_confirm_panel {
    margin-bottom: 8px;
}
</style>