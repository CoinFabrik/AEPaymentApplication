<template>
  <div class="enterpurchase">
    <AeText face="sans-l">Sell Item</AeText>
    <AeText>Customer address {{ customerAddress }}</AeText>

    <AeInput label="Quantity" ref="quantity" placeholder="0" v-model="quantity" />
    <AeInput label="Unit Price" ref="unitprice" placeholder="0.00" v-model="unitPrice" />
    <AeInput label="Description" ref="desc" placeholder="Enter your Item..." v-model="description" />
    <AeText>Total {{ totalPrice }} AE</AeText>
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

import { makeBuyMessage } from "../util/messages";

export default {
  name: "EnterPurchase",
  components: {
    AeButton,
    AeText,
    AeButtonGroup,
    AeInput
  },
  props: {
    customerAddress: String
  },
  data() {
    return {
      quantity: 1,
      unitPrice: 0,
      description: ""
    };
  },
  computed: {
    totalPrice() {
      return this.quantity * this.unitPrice;
    }
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    async confirm() {
      try {
        const message = makeBuyMessage(
          this.totalPrice,
          [this.description],
          this.customerAddress
        );
        await this.$store.state.aeternity.sendMessage(
          this.$store.state.channel,
          message,
          this.$store.getters.responderAddress
        );

        this.$swal
          .fire(
            "Yayy!",
            "Your payment request has been sent to the Point-of-Sale hub",
            "success"
          )
          .then(() => {
            this.$router.replace("mainmenu");
          });
      } catch (e) {
        console.error(e);
      }
    }
  }
};
</script>
