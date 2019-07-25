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
    return {
    };
  },
  methods: {
    dismiss: function() {
      switch (this.txKind) {
        case "initial-deposit":
          this.$router.replace("mainmenu");
          break;
        case "deposit":
          this.$router.replace("mainmenu");
          break;
        case "close-channel":
          this.$router.replace("onboarding");
          break;

        default:
          this.$router.replace("mainmenu");
      }
    }
  },
  mounted: function() {}
};
</script>

<style>
</style>