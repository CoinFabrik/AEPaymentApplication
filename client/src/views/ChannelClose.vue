<template>
  <div class="error">
    <AeText>Are you sure to close your channel?</AeText>
    <AeText face="sans">- Your channel balance will be returned to your wallet.</AeText>
    <AeText
      face="sans-s"
    >- You will need to re open a channel connection to continue operating with the Point of Sale service.</AeText>
    <AeIcon name="sign-out" />
    <ae-button-group>
      <AeButton face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
      <AeButton face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
    </ae-button-group>
  </div>
</template>

<script>
import {
  AeText,
  AeButton,
  AeButtonGroup,
  AeIcon
} from "@aeternity/aepp-components";

export default {
  name: "ChannelClose",
  components: {
    AeText,
    AeButtonGroup,
    AeButton,
    AeIcon
  },
  methods: {
    confirm() {
      this.$router.replace({
        name: "commit-and-wait-tx",
        params: { txKind: "close" }
      });
    },
    cancel() {
      this.$router.back();
    }
  }
};
</script>

