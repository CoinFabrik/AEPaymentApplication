<template>
  <div class="error-content">
    <ae-icon fill="primary" face="round" name="close" />
    <AeText face="sans-l" weight="400" fill="alternative">{{ errorTitle }}</AeText>
    <AeText face="mono-s">{{ errorDescription }}</AeText>
  </div>
</template>

<script>
import { AeText, AeIcon } from "@aeternity/aepp-components";

export default {
  name: "ErrorContent",
  components: {
    AeText,
    AeIcon
  },
  props: {
    errorTitle: String,
    errorDescription: String
  }
};
</script>

<style>
</style>