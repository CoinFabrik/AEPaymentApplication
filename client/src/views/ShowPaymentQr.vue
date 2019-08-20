<template>
  <div class="show-payment-qr">
    <AeText>Show this payment QR to your customer</AeText>
    <AeText face="sans-xs">
      Amount: {{ message.amount }} AE>
    </AeText>
    <AeText face="sans-xs">
      Concept: {{ message.something }}
    </AeText>
    <AeQRCode :value="messageString" />
    <AeButton
      face="round"
      fill="primary"
      extend
      @click="done()"
    >
      Done
    </AeButton>
  </div>
</template>

<script>
import {
  AeText,
  AeQRCode,
  AeButton
} from "@aeternity/aepp-components";

export default {
  name: "MainMenu",
  components: {
    AeText,
    AeQRCode,
    AeButton
  },
  props: {
    message: Object
  },
  computed: {
    messageString: function() {
      return JSON.stringify(this.message);
    }
  },
  methods: {
    done() {
      this.$router.replace("main-menu");
    }
  }
};
</script>