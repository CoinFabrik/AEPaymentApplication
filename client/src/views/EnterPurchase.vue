<template>
  <div class="enterpurchase">
    <AeText face="sans-l">Generate Payment</AeText>
    <AeText>Please enter the payment information to generate a QR code for your customer</AeText>
    <AeInput label="Amount" placeholder="0.00" v-model="amount" units="AE" />
    <AeInput
      label="Concept (optional)"
      ref="desc"
      placeholder="Enter your Item description..."
      v-model="description"
    />
    <ae-button-group>
      <AeButton face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
      <AeButton face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
    </ae-button-group>
  </div>
</template>

<script>
/* eslint-disable no-console */

import {
  AeButton,
  AeButtonGroup,
  AeText,
  AeInput
} from "@aeternity/aepp-components";

import { makePaymentQrData } from "../util/messages";

export default {
  name: "EnterPurchase",
  components: {
    AeButton,
    AeText,
    AeButtonGroup,
    AeInput
  },
  props: {},
  data() {
    return {
      amount: "0.00",
      description: ""
    };
  },

  methods: {
    cancel() {
      this.$router.back();
    },
    async confirm() {
      const message = makePaymentQrData(
        this.amount,
        this.description,
        this.$store.getters.initiatorAddress
      );
      this.$router.replace({ name: "show-payment-qr", params: { message } });
    }
  }
};
</script>
