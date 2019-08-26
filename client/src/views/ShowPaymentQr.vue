<template>
  <b-container class="show-payment-qr">
    <AeText weight="bold">
      Show this payment QR to your customer
    </AeText>
    <br>
    <AeDivider />
    <br>
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
      class="margin"
      extend
      @click="done()"
    >
      Done
    </AeButton>
  </b-container>
</template>

<script>
import {
  AeText,
	AeQRCode,
	AeDivider,
  AeButton
} from "@aeternity/aepp-components";

export default {
  name: "MainMenu",
  components: {
    AeText,
		AeQRCode,
		AeDivider,
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

<style>
	.margin {
		margin-top: 10px;
	}
</style>
