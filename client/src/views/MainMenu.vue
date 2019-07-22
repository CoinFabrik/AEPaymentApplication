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
        <AeButton face="round" fill="primary" extend @click="scanTxQr()">Scan Qr</AeButton>
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
import {
  AeText,
  AeQRCode,
  AeAmount,
  AeButton
} from "@aeternity/aepp-components";

export default {
  name: "MainMenu",
  components: {
    AeText,
    AeQRCode,
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
    scanTxQr: function() {
      this.$router.push( { name: 'scanqr', params: { subview: 'scantxqr'} } )
    },
    closeChannel: function() {
      this.$router.push( { name: 'confirm-tx', params: { txKind: 'close-channel'} } )
    },
    history: function() {
      this.$router.push('history')
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