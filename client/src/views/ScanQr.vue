<template>
  <div class="scanqrview">
    <div v-if="this.subview === 'onboarding'">
      <AeText>To access AE Universe Services, please scan the "Onboarding" QR Code at your nearest AEUniverse Conference
        Stand</AeText>
    </div>
    <div v-if="this.subview === 'scantxqr'">
      <AeText>Scan a QR Code for your desired transaction</AeText>
    </div>
    <div id="scan_qr_container">
      <QrCodeReader @hasData="onQrHasData" @error="onQrHasError" />
    </div>
  </div>
</template>

<script>

  import QrCodeReader from "../components/QrCodeReader.vue"
  import {
    AeText
  } from "@aeternity/aepp-components";
  export default {
    name: "ScanQR",
    components: {
      AeText,
      QrCodeReader
    },
    data() {
      return {
      };
    },
    props: {
      subview: String
    },
    computed: {

    },
    mounted: function () {
      if (this.subview !== 'onboarding' && this.subview !== 'scantxqr') {
        throw Error("The subview prop must be 'onboarding' or 'scantxqr'");
      }
    },
    methods: {
      onQrHasData(scanData) {
        console.log("Obtained QR Data: " + scanData);
        if (process.env.VUE_APP_ONBOARDING_QR_ACCEPT_ANY) {
          this.$router.push({ name: 'deposit', params: { initialDeposit: true } });
        }
        else {
          try {
            const dataObj = JSON.parse(scanData);
          } catch (err) {
            alert("This is not a valid QR ");
          }

          if (dataObj.node === undefined && dataObj.posservice === undefined) {

          }
        }
      },
      onQrHasError(event, error) {
        alert(error)
      }
    }
  };
</script>