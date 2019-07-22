<template>
  <div class="error">
    <ae-icon fill="primary" face="round" name="close" />
    <AeText face="sans-l" weight="400" fill="alternative">{{ errorTitle }}</AeText>
    <AeText face="mono-s" >{{ errorDescription }}</AeText>
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
  import {
    AeText,
    AeButton,
    AeButtonGroup,
    AeIcon
  } from "@aeternity/aepp-components";

  export default {
    name: "Error",
    components: {
      AeText,
      AeButtonGroup,
      AeButton,
      AeIcon
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