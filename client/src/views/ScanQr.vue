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
				<div v-if="this.subview === 'pay-with-qr'">
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
//import HubConnection from "../controllers/hub";
import BigNumber from "bignumber.js";
import { validatePurchaseQr, validateOnboardingQr } from "../util/validators";

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
      this.subview !== "pay-with-qr" &&
      this.subview !== "scanaddress"
    ) {
      throw Error(
        "The subview prop must be 'onboarding' , 'pay-with-qr' or 'scanaddress'"
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
      console.log("Obtained QR Data: " + scanData);

      if (process.env.VUE_APP_ONBOARDING_QR_ACCEPT_ANY === 1) {
				this.storeTestParams();
        this.navigateOut();
      } else {
        if (this.subview === "pay-with-qr") {
          if (!validatePurchaseQr(scanData)) {
            this.$swal.fire({
              heightAuto: false,
              type: "info",
              title: "Oops...",
              text:
                "This QR Code does not seem to contain payment information. Please re-scan a new one."
            });
					}
					// this.$swal({
					// 	title: '<AeText>Is this the correct QR code?</AeText>',
					// 	type: 'error',
					// 	html:'<AeText>It seems like that QR code is not correct!</AeText>',
					// 	focusConfirm: false,
					// 	confirmButtonText:
					// 		'SCAN AGAIN',
					// })
        } else if (this.subview === "onboarding") {
          if (!validateOnboardingQr(scanData)) {
            this.$swal.fire({
              heightAuto: false,
              type: "info",
              title: "Oops...",
              text:
                "This does not seem to be a correct onboarding QR Code. Please re-scan a new one."
            });
          }
        }
        // if (dataObj.qrkind === "AE_PARAMETER_PACK") {
        //   this.$store.commit("loadChannelParams", dataObj.params);
        //   this.navigateOut();
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
        } else if (this.subview === "pay-with-qr") {
          this.qrData = {
            amount: new BigNumber(3.5)
              .multipliedBy(new BigNumber(10).exponentiatedBy(18))
              .toString(10),
            merchant: "ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv",
            merchant_name: "TOTO'S BAR",
            something: "3 BEERS"
          };
        }
        this.navigateOut();
      }
    },
    async navigateOut() {
      if (this.subview === "onboarding") {
        await this.doOnboardingProcess();
      } else if (this.subview === "pay-with-qr") {
        console.log("Gonna confirm", this.qrData);
        this.$router.push({
          name: "confirm-payment",
          params: { paymentData: this.qrData }
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
      this.$router.push("register-user");
    },
    storeTestParams() {
      // Store development test channel parameters

      let params = {
        initiatorId: process.env.VUE_APP_TEST_WALLET_ADDRESS,
        responderId: null, // known after connection with Hub

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
