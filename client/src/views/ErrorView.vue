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
        <AeButton face="round" fill="primary" v-on:click="goBack" style="position: absolute; right: 0; top: 0">X</AeButton>
    </div>
  </div>
</template>

<script>
  import ErrorContent from '../components/ErrorContent.vue'
  import {
    AeText,
    AeButton,
    AeButtonGroup,
    AeIcon,
  } from "@aeternity/aepp-components";

  export default {
    name: "ErrorView",
    components: {
      AeText,
      AeButtonGroup,
      AeButton,
      AeIcon,
      ErrorContent
    },
    props: {
      errorTitle: String,
      errorDescription: String,
      onRetryNavTo: String,
      onCancelNavTo: String,
      retryCancel: Boolean
    },
    data() {
      return {
      };
    },
    computed: {
      
    },
    methods: {
      retry: function () {

      },
      cancel: function () {

      },
      goBack: function() {
        this.$router.go(-1);
      }
    },
    mounted: function () {
    }
  };
</script>

<style>

</style>