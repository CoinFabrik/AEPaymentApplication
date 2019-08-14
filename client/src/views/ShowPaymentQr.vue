<template>
  <div class="show-payment-qr">
    <AeText>Show this payment QR to your customer</AeText>
    <AeText face="sans-xs">Amount: {{ message.amount }} AE></AeText>
    <AeText face="sans-xs">Concept: {{ message.something }}</AeText>
    <AeQRCode v-bind:value="messageString" />
    <AeButton face="round" fill="primary" extend @click="done()">Done</AeButton>
  </div>
</template>

<script>
import {
  AeText,
  AeQRCode,
  AeAmount,
  AeButton
} from "@aeternity/aepp-components";

export default {
  name: "MainMenu",
  props: {
    message: Object
  },
  computed: {
    messageString: function() {
      return JSON.stringify(this.message);
    }
  },
  components: {
    AeText,
    AeQRCode,
    AeAmount,
    AeButton
  },
  methods: {
    done() {
      this.$router.replace("main-menu");
    }
  }
};
</script>