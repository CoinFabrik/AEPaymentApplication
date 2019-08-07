<template>
  <div class="shutdowndone">
    <AeText face="sans-l">Thanks for operating with our service!</AeText>
    <AeText
      face="sans"
    >You will need to redo the onboarding steps to operate again with the PoS service.</AeText>
    <AeButton face="round" fill="primary" extend @click="dismiss()">Dismiss</AeButton>
  </div>
</template>

<script>
import { AeText, AeButton } from "@aeternity/aepp-components";

export default {
  name: "ShutdownDone",
  components: {
    AeText,
    AeButton
    //AeIcon
  },
  methods: {
    dismiss() {
      this.$router.replace({
        name: "scanqr",
        params: { subview: "onboarding" }
      });
    }
  }
};
</script>

