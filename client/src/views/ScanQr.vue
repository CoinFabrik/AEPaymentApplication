<template>
  <div class="scanqrview">
    <div v-if="this.subview === 'onboarding'">
      <AeText>
        To access AE Universe Services, please scan the "Onboarding" QR Code at your nearest AEUniverse Conference
        Stand
      </AeText>
    </div>
    <div v-if="this.subview === 'scantxqr'">
      <AeText>Scan a QR Code for your desired transaction</AeText>
    </div>
    <div id="scan_qr_container" @click="onQrClick">
      <QrCodeReader @hasData="onQrHasData" @error="onQrHasError" />
    </div>
  </div>
</template>

<script>
import QrCodeReader from "../components/QrCodeReader.vue";
import { AeText } from "@aeternity/aepp-components";
import HubConnection from "../controllers/hub";

export default {
  name: "ScanQR",
  components: {
    AeText,
    QrCodeReader
  },
  data() {
    return {};
  },
  props: {
    subview: String
  },
  computed: {},
  mounted: function() {
    if (this.subview !== "onboarding" && this.subview !== "scantxqr") {
      throw Error("The subview prop must be 'onboarding' or 'scantxqr'");
    }
  },
  methods: {
    onQrHasData(scanData) {
      let dataObj;
      console.log("Obtained QR Data: " + scanData);

      if (process.env.VUE_APP_ONBOARDING_QR_ACCEPT_ANY === 1) {
        this.storeTestParams();
        this.navigateOut();
      } else {
        try {
          dataObj = JSON.parse(scanData);
        } catch (err) {
          alert("This is not a valid QR ");
          return;
        }

        if (dataObj.qrkind === "AE_PARAMETER_PACK") {
          this.$store.commit("loadChannelParams", dataObj.params);
          this.navigateOut();
        }
      }
    },
    onQrHasError(event, error) {
      alert(error);
    },
    onQrClick() {
      if (process.env.VUE_APP_SIMULATE_QRSCAN_CLICK === "1") {
        this.storeTestParams();
        this.navigateOut();
      }
    },
    async navigateOut() {
      if (this.subview === "onboarding") {
        if (this.$isClientAppRole) {
          this.$router.push({
            name: "deposit",
            params: { initialDeposit: true }
          });
        } else if (this.$isMerchantAppRole) {
          let hubConnection = new HubConnection(
            this.$store.state.hubUrl,
            this.$store.getters.initiatorId
          );
          try {
            let ret = await hubConnection.getMerchantName();
            if (ret.success === false) {
              if (ret.code === 404) {
                // No registered merchant name.
                this.$router.push("register-merchant");
              } else {
                // unexpected error.
                this.alert(
                  "Error. must design a proper error screen here ! ",
                  e
                );
              }
            } else {
              // Welcome back.
              this.$router.push({
                name: "deposit",
                params: { initialDeposit: true, welcomeBack: true }
              });
            }
          } catch (e) {
            // PROPER ERROR PLEASE.

            this.alert("Error. must design a proper error screen here ! ", e);
          }
        }
      } else if (this.subview === "scantxqr") {
        this.$router.push({
          name: "confirmtx",
          params: { txKind: "transact-from-qr" }
        });
      }
    },
    storeTestParams() {
      // Store development test channel parameters

      let params = {
        initiatorId: process.env.VUE_APP_TEST_WALLET_ADDRESS,
        responderId: process.env.VUE_APP_TEST_RESPONDER_ADDRESS,

        // Initial deposit in favour of the responder by the initiator
        pushAmount: process.env.VUE_APP_TEST_CHANNEL_PUSH_AMOUNT,

        // Amount of tokes initiator will deposit into state channel
        initiatorAmount: 0,

        // Amount of tokes responder will deposit into state channel
        responderAmount: process.env.VUE_APP_TEST_CHANNEL_RESPONDER_AMOUNT,

        // Minimum amount both peers need to maintain
        channelReserve: process.env.VUE_APP_TEST_CHANNEL_RESERVE,

        // Minimum block height to include the channel_create_tx
        ttl: process.env.VUE_APP_TEST_CHANNEL_TTL,

        // Amount of blocks for disputing a solo close
        lockPeriod: process.env.VUE_APP_TEST_CHANNEL_LOCK_PERIOD,

        // Host of the responder's node
        host: process.env.VUE_APP_TEST_RESPONDER_HOST,

        // Port of the responders node
        port: process.env.VUE_APP_TEST_RESPONDER_PORT,
        //
        role: "initiator",
        url: this.$store.state.aeternity.getStateChannelApiUrl(),
        sign: this.$store.state.aeternity.signFunction
      };

      this.$store.commit("loadChannelParams", params);
      this.$store.commit("loadHubUri", process.env.VUE_APP_TEST_HUB_URL);
    }
  }
};
</script>