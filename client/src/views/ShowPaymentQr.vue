<template>
  <b-container class="show-payment-qr">
    <AeText weight="bold">
      Show this payment QR to your customer
    </AeText>
    <br>
    <AeText face="sans-xs">
      Amount: {{ message.amount / (10**18) }} AE
    </AeText>
    <br>
    <AeText
      v-show="message.something.length > 0"
      face="sans-xs"
    >
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

export default {
  name: "MainMenu",
  props: {
    message: Object
  },
  data() {
    return { paymentCode: "" };
  },
  computed: {
    messageString: function() {
      return JSON.stringify(this.message);
    }
  },
  async mounted() {
    
  },
  methods: {
   
    done() {
      this.$router.replace("main-menu");
    }
  }
};
</script>

<style>
canvas { 
  width: 70%
}
	.margin {
		margin-top: 10px;
	}
</style>
