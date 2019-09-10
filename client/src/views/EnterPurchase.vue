<template>
  <b-container class="enterpurchase">
    <AeText
      face="sans-l"
      weight="bold"
    >
      Generate Payment
    </AeText>
    <br>
    <AeText face="sans-s">
      Please set the amount of the payment. A new QR code will be generated.
    </AeText>
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
      monospace="true"
      class="small-input"
      label="Concept (optional)"
      placeholder="Description..."
    />
    <br>
    <AeButton
      face="round"
      fill="primary"
      class="margin"
      extend
      :disabled="!isValidInput"
      @click="confirm()"
    >
      Confirm
    </AeButton>
    <AeButton
      face="round"
      fill="neutral"
      class="margin"
      extend
      @click="cancel()"
    >
      Cancel
    </AeButton>
  </b-container>
</template>

<script>
/* eslint-disable no-console */
import { makePaymentQrData } from "../util/messages";
import BigNumber from 'bignumber.js'

export default {
  name: "EnterPurchase",
  props: {},
  data() {
    return {
      amount: "0.00",
      description: ""
    };
  },
  computed: {
    isValidInput() {
      return BigNumber(this.amount).gt(0);
    }
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
