<template>
    <div class="main-app">
      <div class="row">
        <div class="column">
          <AeQRCode value="getAddress()"/>
        </div>
          <div class="column">
            <AeText fill="secondary">Channel Funds</AeText>
            <ae-amount value="1.36"  unit="Æ" size="med"/>
          </div>
        
      </div>
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="deposit()">Deposit</AeButton>
      </div>
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="scanqr()">Scan Qr</AeButton>
      </div>
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="closeChannel()">Close Channel</AeButton>
      </div>
      <div class="row">
        <AeButton face="round" fill="primary" extend @click="history()">History</AeButton>
      </div>
    </div>
</template>

<script>
import aeternity from '../controllers/network.js'
import {
  AeText,
  AeQRCode,
  AeDivider,
  AeLabel,
  AeAmount,
  AeButton
} from "@aeternity/aepp-components";

export default {
  name: "MainMenu",
  components: {
    AeText,
    AeQRCode,
    AeDivider,
    AeLabel,
    AeAmount,
    AeButton
  },
  computed: {
    getAddress: function() { return "xxxxxx";}
  },
  methods: {
    deposit: function() {
      this.$router.push('deposit');
    },
    scanqr: function() {

    },
    closeChannel: function() {

    },
    history: function() {

    }
  }
};
</script>

<style>
.row {
  display: flex;
  padding-bottom: 20px;
}

.column {
  flex: 50%;
}
</style>