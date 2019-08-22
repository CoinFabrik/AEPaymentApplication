<template>
  <b-container class="enterpurchase">
    <AeText
      face="sans-l"
      weight="bold"
    >
      Generate Payment
    </AeText>
    <br>
    <AeText>Please enter the payment information to generate a QR code for your customer</AeText>
    <br>
    <AeInput
      v-model="amount"
      label="Amount"
      placeholder="0.00"
      units="AE"
    />
    <br>
    <AeInput
      ref="desc"
      v-model="description"
      label="Concept (optional)"
      placeholder="Enter your Item description..."
    />
    <br>
    <AeButton
      face="round"
      fill="primary"
      class="button"
      extend
      @click="confirm()"
    >
      Confirm
    </AeButton>
    <AeButton
      face="round"
      fill="secondary"
      class="button"
      extend
      @click="cancel()"
    >
      Cancel
    </AeButton>
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import {
  AeButton,
  AeText,
  AeInput
} from "@aeternity/aepp-components";

import { makePaymentQrData } from "../util/messages";

export default {
  name: "EnterPurchase",
  components: {
    AeButton,
    AeText,
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

<style>
	.button {
		margin-top: 5px;
	}
</style>
