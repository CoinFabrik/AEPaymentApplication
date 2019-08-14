<template>
  <div class="success">
    <div v-if="txKind === 'initial-deposit'">
      <AeText face="sans-l" fill="primary">Success</AeText>
      <AeText>A state channel with our Point-of-Sale service has been successfully established.</AeText>

      <AeDivider />
      <AeText face="sans-s">....Enjoy (more text here ... )</AeText>
    </div>

    <div v-if="txKind === 'deposit'">
      <AeText face="sans-xl" fill="primary">Success</AeText>
      <AeText>Your requested AE amount has been deposited in the channel.</AeText>

      <AeDivider />
      <AeText face="sans-s">Enjoy (more text here ... )</AeText>
    </div>

    <ae-icon fill="secondary" face="round" name="check" />
    <AeButton fill="primary" face="round" @click="dismiss()">Next</AeButton>

    <div v-if="txKind === 'register-merchant'">
      <AeText face="sans-xl" fill="primary">Thanks!</AeText>
      <AeText>You have been successfully registered to the Point of Sale system.</AeText>
    </div>
  </div>
</template>

<script>
import {
  AeText,
  AeButton,
  AeDivider,
  AeIcon
} from "@aeternity/aepp-components";

export default {
  name: "Success",
  components: {
    AeText,
    AeButton,
    AeDivider,
    AeIcon
  },
  props: {
    txKind: String
  },
  data() {
    return {};
  },
  methods: {
    dismiss: function() {
      switch (this.txKind) {
        case "initial-deposit":
          this.$router.replace("main-menu");
          break;
        case "deposit":
          this.$router.replace("main-menu");
          break;
        case "close-channel":
          this.$router.replace("onboarding");
          break;
        case "register-merchant":
          this.$router.replace( { name: "deposit", params: { initialDeposit: true }})
          break;
        default:
          this.$router.replace("main-menu");
      }
    }
  },
  mounted: function() {}
};
</script>

<style>
</style>