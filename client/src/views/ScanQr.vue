<template>
	<div class="scanqrview">
		<b-container>
			<b-row align-h="center">
				<!-- <div v-if="this.subview === 'onboarding'">
					<AeText face="sans-s">
						To access AE Universe Services, please scan the "Onboarding" QR Code at your nearest AEUniverse Conference
						Stand
					</AeText>
				</div> -->
				<!-- <br> -->
				<div v-if="this.subview === 'scantxqr'">
					<AeText>Scan a QR Code for your desired transaction</AeText>
				</div>

				<div id="scan_qr_container" @click="onQrClick">
					<div id="scan_qr_subcontainer" @click="onQrClick">
						<QrCodeReader @hasData="onQrHasData" @error="onQrHasError" />
					</div>
				</div>
			</b-row>
		</b-container>
	</div>

</template>

<script>
/* eslint-disable no-console */

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
    return {
      qrData: null
    };
  },
  props: {
    subview: String
  },
  computed: {},
  mounted: function() {
    if (
      this.subview !== "onboarding" &&
      this.subview !== "scantxqr" &&
      this.subview !== "scanaddress"
    ) {
      throw Error(
        "The subview prop must be 'onboarding' , 'scantxqr' or 'scanaddress'"
      );
    }
  },
  methods: {
    setError(err) {
      this.$router.push({
        name: "error",
        params: {
          errorTitle: "Oops",
          errorDescription: err.toString(),
          retryCancel: false
        }
      });
    },
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
          this.$swal({
						title: '<AeText>Is this the correct QR code?</AeText>',
						type: 'error',
						html:'<AeText>It seems like that QR code is not correct!</AeText>',
						focusConfirm: false,
						confirmButtonText:
							'SCAN AGAIN',
					})
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
      //
      // A click on the QR element box will trigger out a simulated
      // QR scan if its enabled in the environment settings
      //
      if (process.env.VUE_APP_SIMULATE_QRSCAN_CLICK === "1") {
        if (this.subview === "onboarding") {
          this.storeTestParams();
        } else if (this.subview === "scanaddress") {
          this.qrData = process.env.VUE_APP_TEST_CUSTOMER_ADDRESS;
        }
        this.navigateOut();
      }
    },
    async navigateOut() {
      if (this.subview === "onboarding") {
        await this.doOnboardingProcess();
      } else if (this.subview === "scantxqr") {
        this.$router.push({
          name: "confirmtx",
          params: { txKind: "transact-from-qr" }
        });
      } else if (this.subview === "scanaddress") {
        await this.doProcessAddress();
      }
    },
    doProcessAddress() {
      if (this.$isMerchantAppRole) {
        this.$router.push({
          name: "enterpurchase",
          params: { customerAddress: this.qrData }
        });
      }
    },
    async doOnboardingProcess() {
      if (this.$isClientAppRole) {
        this.$router.push({
          name: "deposit",
          params: { initialDeposit: true }
        });
      } else if (this.$isMerchantAppRole) {
        let hubConnection = new HubConnection(
          this.$store.state.hubUrl,
          this.$store.getters.initiatorAddress
        );
        try {
          let ret = await hubConnection.getMerchantName();
          if (ret.success === false) {
            if (ret.code === 404) {
              // No registered merchant name.
              this.$router.push("register-merchant");
            } else {
              // unexpected error.
              this.setError(
                "A problem occurred communicating with the hub. Please contact the system administrator."
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
          this.setError(e);
        }
      }
    },
    storeTestParams() {
      // Store development test channel parameters

      let params = {
        initiatorId: process.env.VUE_APP_TEST_WALLET_ADDRESS,
        responderId: null,  // known after connection with Hub

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
      this.$store.commit("loadHubUrl", process.env.VUE_APP_TEST_HUB_URL);
    }
  }
};
</script>

<style>
	#scan_qr_subcontainer {
		height: 150px;
		width: 150px;
		border-radius: 30px;
		border:1px dashed red;
		position: relative;
		top: 50%;
    left: 50%;
		transform: translate(-50%, -50%)
	}
	#scan_qr_container {
		height: 200px;
		width: 200px;
		border-radius: 30px;
		border:1px solid #311B58;
	}
</style>
