<template>
  <b-container class="show-payment-qr">
    <AeText weight="bold">
      Show this payment QR to your customer
    </AeText>
    <br>
    <AeDivider />
    <br>
    <AeText face="sans-xs">
      Amount: {{ message.amount / (10**18) }} AE>
    </AeText>
    <AeText face="sans-xs">
      Concept: {{ message.something }}
    </AeText>
    <!--
    If QR scan is disabled, this will store a temporary payment UUID
     in the server from where the customer can obtain the same data using
     the UUID instead of the QR.
    -->
    <AeText v-if="isQrCodesDisabled">
      Payment Code: {{ paymentCode }}
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
import HubConnection from "../controllers/hub";

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
  data() {
    return { paymentCode: "" };
  },
  computed: {
    messageString: function() {
      return JSON.stringify(this.message);
    },
    isQrCodesDisabled() {
      return parseInt(process.env.VUE_APP_DISABLE_QRCODES) != 0;
    }
  },
  async mounted() {
    this.paymentCode = this.makeShortId(8);
    try {
      let hubConnection = new HubConnection(
        this.$store.state.hubUrl,
        this.$store.getters.initiatorAddress
      );

      let res = await hubConnection.storeProductData(
        this.messageString,
        this.paymentCode
      );

      if (!res.success) {
        throw new Error(res.error);
      }

      console.log("Stored ID " + this.paymentCode + "at payment hub");
    } catch (e) {
      this.$displayError(
        "Oops!",
        "We could not connect to the payment hub to store UID!" +
          "Reason: " +
          e.toString(),
        () => {
          this.$router.replace("main-menu");
        }
      );
    }
  },
  methods: {
    makeShortId(length) {
      var result = "";
      var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    },
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
