<template>
  <div class="error">
    <ErrorContent v-bind:errorTitle="errorTitle" v-bind:errorDescription="errorDescription" />
    <div v-if="retryCancel">
      <ae-button-group>
        <AeButton face="round" fill="primary" extend @click="retry()">Retry</AeButton>
        <AeButton face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
      </ae-button-group>
    </div>
    <div v-else>
      <AeButton
        face="round"
        fill="primary"
        v-on:click="goBack"
        style="position: absolute; right: 0; top: 0"
      >Dismiss</AeButton>
    </div>
  </div>
</template>

<script>
import ErrorContent from "../components/ErrorContent.vue";
import {
  AeText,
  AeButton,
  AeButtonGroup,
  AeIcon
} from "@aeternity/aepp-components";

export default {
  name: "ErrorView",
  components: {
    AeButtonGroup,
    AeButton,
    ErrorContent
  },
  props: {
    errorTitle: String,
    errorDescription: String,
    onRetryNavTo: Object,
    onCancelNavTo: Object,
    onDismissNavTo: Object,
    retryCancel: Boolean
  },
  data() {
    return {};
  },
  computed: {},
  methods: {
    retry() {
      this.$router.replace(this.onRetryNavTo);
    },
    cancel() {
      this.$router.replace(this.onCancelNavTo);
    },
    goBack() {
      if (this.onDismissNavTo) {
        this.$router.replace(this.onDismissNavTo);
      } else {
        this.$router.back();
      }
    }
  },
  mounted: function() {}
};
</script>

<style>
</style>