<template>
  <div class="scanqrview">
    <b-container>
      <b-row align-h="center">
        <!-- <div v-if="this.subview === 'onboarding'">
					<AeText face="sans-s">
						To access AE Universe Services, please scan the "Onboarding" QR Code at your nearest AEUniverse Conference
						Stand
					</AeText>
        </div>-->
        <!-- <br> -->
        <div v-if="this.subview === 'pay-with-qr'">
          <AeText>Scan a QR Code for your desired transaction</AeText>
        </div>

        <div
          id="scan_qr_container"
          @click="onQrClick"
        >
          <div
            id="scan_qr_subcontainer"
            @click="onQrClick"
          >
            <QrCodeReader
              @hasData="onQrHasData"
              @error="onQrHasError"
            />
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
const uuidv4 = require("uuid/v4");

export default {
  name: "ScanQR",
  components: {
    AeText,
    QrCodeReader
  },
  props: {
    subview: String
  },
  data() {
    return {
      qrData: null
    };
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
    onQrHasData(scanData) {
      console.log("Obtained QR Data: " + scanData);

      if (process.env.VUE_APP_ONBOARDING_QR_ACCEPT_ANY === 1) {
        this.qrData.hub = process.env.VUE_APP_TEST_HUB_IP_PORT;
        this.qrData.node =
          process.env.VUE_APP_TEST_API_SERVER_PROTO +
          "//" +
          process.env.VUE_APP_TEST_API_SERVER_ADDRESS +
          ":" +
          process.env.VUE_APP_TEST_API_SERVER_PORT;

        console.warn(
          "VUE_APP_ONBOARDING_QR_ACCEPT_ANY active. Setup simulated QR data: " +
            this.qrData
        );
        this.$store
          .dispatch("storeNetChannelParameters", this.qrData.hub)
          .then(() => {
            this.navigateOut();
          });
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
          } else {
            this.qrData = JSON.parse(scanData);
            this.navigateOut();
          }
        } else if (this.subview === "onboarding") {
          if (!validateOnboardingQr(scanData)) {
            this.$swal.fire({
              heightAuto: false,
              type: "info",
              title: "Oops...",
              text:
                "This does not seem to be a correct onboarding QR Code. Please re-scan a new one."
            });
          } else {
            this.qrData = JSON.parse(scanData);
            this.$store
              .dispatch("storeNetChannelParameters", this.qrData.hub)
              .then(() => this.navigateOut());
          }
        }
      }
    },
    onQrHasError(event, error) {
      this.$displayError(
        "Oops!",
        "The QR Scanning process failed with an unexpected error. Reason is: " +
          error.toString() +
          ".  Please try again with another code"
      );
    },
    onQrClick() {
      //
      // A click on the QR element box will trigger out a simulated
      // QR scan if its enabled in the environment settings
      //
      if (process.env.VUE_APP_SIMULATE_QRSCAN_CLICK === "1") {
        if (this.subview === "onboarding") {
          this.qrData = {
            hub: process.env.VUE_APP_TEST_HUB_IP_PORT
          };

          console.warn(
            "VUE_APP_SIMULATE_QRSCAN_CLICK active. Setup simulated onboarding QR data: " +
              this.qrData
          );
          this.$store
            .dispatch("storeNetChannelParameters", this.qrData.hub)
            .then(() => this.navigateOut());
        } else if (this.subview === "scanaddress") {
          this.qrData = process.env.VUE_APP_TEST_CUSTOMER_ADDRESS;
          this.navigateOut();
        } else if (this.subview === "pay-with-qr") {
          this.qrData = {
            //
            // Mock payment data
            //
            amount: new BigNumber(0.001234)
              .multipliedBy(new BigNumber(10).exponentiatedBy(18))
              .toString(10),
            merchant: "ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv",
            something: "3 BEERS",
            id: uuidv4(),
            type: "payment-request"
          };
          console.warn(
            "VUE_APP_SIMULATE_QRSCAN_CLICK active. Setup simulated payment QR data: " +
              this.qrData
          );
          this.navigateOut();
        }
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
    }
  }
};
</script>

<style>
#scan_qr_subcontainer {
  height: 150px;
  width: 150px;
  border-radius: 30px;
  border: 1px dashed red;
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
#scan_qr_container {
  height: 200px;
  width: 200px;
  border-radius: 30px;
  border: 1px solid #311b58;
}
</style>
