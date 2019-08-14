<template>
  <div class="confirm-payment">
    <AeText align="center" face="sans-l">Please check your payment</AeText>

    <div class="paymentinfo">
      <div class="row">
        <div class="column"></div>
        <div class="column"></div>
      </div>

      <div class="row">
        <div class="column"></div>
        <div class="column"></div>
      </div>

      <div class="row">
        <div class="column"></div>
        <div class="column"></div>
      </div>
    </div>

    <ae-button-group>
      <AeButton face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
      <AeButton face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
    </ae-button-group>
  </div>
</template>

<script>
import { AeText, AeButtonGroup, AeButton } from "@aeternity/aepp-components";

import BigNumber from "bignumber.js";

export default {
  name: "ConfirmPayment",
  components: {
    AeButton,
    AeText,
    AeButtonGroup
  },
  props: {
    paymentData: Object
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
      this.$router.replace("main-menu");
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
.row {
  display: flex;
}

.column {
  flex: 50%;
}

.paymentinfo {
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>