<template>
  <b-container class="show-payment-qr">
    <AeText weight="bold">
      Show this payment QR to your customer
    </AeText>
    <br>
    <AeText face="sans-s">
      Amount: <b>{{ message.amount / (10**18) }} AE</b>
    </AeText>
    <AeText
      v-show="message.something.length > 0"
      face="sans-s"
    >
      Concept: <b>{{ message.something }}</b>
    </AeText>

    <div class="my-3">
      <AeQRCode :value="messageString" />
    </div>

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
