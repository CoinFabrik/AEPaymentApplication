<template>
  <b-container class="scanqrview">
    <ViewTitle
      :title="subview === 'pay-with-qr' ? 'Scan the payment request QR code from the merchant\'s device.' : 'Scan the QR code to open the payments channel.'"
    />
    <b-row align-h="center">
      <div v-if="">
        <AeText weight="500" />
      </div>

      <!--
      <div v-if="!isDisabledCodeReader || subview === 'onboarding'" -->
      <div
        id="scan_qr_container"
        @click="onQrClick"
      >
        <div v-if="subview === 'pay-with-qr'">
          <AeText face="sans-s">
            Payment Code
          </AeText>
          <input
            id="payment-code-input"
            type="text"
          >
          <AeButton
            id="load-payment-code"
            face="primary"
            text="Load"
            @click="loadPaymentCode"
          >
            Load
          </AeButton>
        </div>

        <div
          id="scan_qr_subcontainer"
        >
          <QrCodeReader
            :key="scanCount"
            @hasData="onQrHasData"
            @error="onQrHasError"
          />
        </div>
        <!-- <div v-if="isDisabledCodeReader && subview === 'pay-with-qr'"> -->
      </div>
    </b-row>
     
    <ViewButtonSection
      :buttons="[{name: 'Cancel', action: cancel, cancel:true}]"
    />
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import QrCodeReader from "../components/QrCodeReader.vue";
//import HubConnection from "../controllers/hub";
import BigNumber from "bignumber.js";
import { validatePurchaseQr, validateOnboardingQr } from "../util/validators";
import { BrowserQRCodeReader } from "@zxing/library/esm5/browser/BrowserQRCodeReader";
import HubConnection from "../controllers/hub";
const uuidv4 = require("uuid/v4");

export default {
  name: "ScanQR",
  components: {
		QrCodeReader,
  },
  props: {
    subview: String
  },
  data() {
    return {
      scanCount: 0,
      qrData: null
    };
  },
  computed: {
    isDisabledCodeReader() {
      return parseInt(process.env.VUE_APP_DISABLE_QRCODES) != 0;
    }
  },
  mounted: function() {
    if (
      this.subview !== "onboarding" &&
      this.subview !== "pay-with-qr" &&
      this.subview !== "scanaddress"
    ) {
        console.log(this.$store.state.route.params);
      throw Error(
        "The subview prop must be 'onboarding' , 'pay-with-qr' or 'scanaddress'"
      );
    }
  },
  methods: {
    async loadPaymentCode() {
      const paymentCode = document.getElementById("payment-code-input").value;
      try {
        let hubConnection = new HubConnection(
          this.$store.state.hubUrl,
          this.$store.getters.initiatorAddress
        );

        let res = await hubConnection.fetchProductData(paymentCode);
        if (!res.success) {
          throw new Error(res.error);
        }

        console.log("Got data from payment hub:  " + res.data);
        this.processPaymentData(res.data, false, true);
      } catch (e) {
        this.$displayError(
          "Oops!",
          "We could not connect to the payment hub to fetch code" +
            "Reason: " +
            e.toString(),
          () => {
            this.$router.replace("main-menu");
          }
        );
      }
    },
    processPaymentData(data, isFromQr, generateNewUuid) {
      if (!validatePurchaseQr(data)) {
        this.$swal.fire({
          heightAuto: false,
          type: "info",
          title: "Oops...",
          text:
            "This " + isFromQr
              ? "QR Code"
              : "Payment Code" +
                " does not seem to contain payment information. Please try with another one."
        });
      } else {
        this.qrData = JSON.parse(data);
        if (
          BigNumber(data.amount).gt(
            BigNumber(this.$store.state.initiatorBalance)
          )
        ) {
          this.$swal.fire({
            heightAuto: false,
            type: "warning",
            title: "Insufficient balance",
            text:
              "You don't have enough channel balance to pay for this product. You may deposit funds and purchase this item again later. "
          });
        } else {
          this.navigateOut();
        }
      }
    },
    onQrHasData(scanData) {
      console.log("Obtained QR Data: " + scanData);

      if (this.subview === "pay-with-qr") {
        this.processPaymentData(scanData, true, false);
      } else if (this.subview === "onboarding") {
        if (!validateOnboardingQr(scanData)) {
          this.$swal.fire({
            heightAuto: false,
            type: "info",
            title: "Oops...",
            text:
              "This does not seem to be a correct onboarding QR Code. Please re-scan a new one."
          }).then ( () => {
          this.scanCount++;
          });
          
        } else {
          this.qrData = JSON.parse(scanData);
          this.navigateOut();
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
      if (process.env.VUE_APP_DISABLE_QRCODES === "1") {
        if (this.subview === "onboarding") {
          this.qrData = {
            hub: process.env.VUE_APP_TEST_HUB_IP_PORT
          };

          console.warn(
            "VUE_APP_DISABLE_QRCODES active. Setup simulated onboarding QR data: " +
              this.qrData
          );
          this.navigateOut();
        } else if (this.subview === "scanaddress") {
          this.qrData = process.env.VUE_APP_TEST_CUSTOMER_ADDRESS;
          this.navigateOut();
        } else if (this.subview === "pay-with-qr") {
          // this.qrData = {
          //   //
          //   // Mock payment data
          //   //
          //   amount: new BigNumber(0.001234)
          //     .multipliedBy(new BigNumber(10).exponentiatedBy(18))
          //     .toString(10),
          //   merchant: "ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv",
          //   something: "3 BEERS",
          //   id: uuidv4(),
          //   type: "payment-request"
          // };
          // console.warn(
          //   "VUE_APP_DISABLE_QRCODES active. Setup simulated payment QR data: " +
          //     this.qrData
          // );
          // this.navigateOut();
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
      this.$store.commit('loadHubIpAddr', this.qrData.hub);
      this.$store.commit('setOnboardingQrScan', true);
      this.$router.replace("register-user");
		},
		cancel() {
			this.$router.back()
		}
  }
};
</script>

<style scoped>
#scan_qr_subcontainer {
  height: 250px;
  width: 250px;
  border-radius: 30px;
  border: 1px dashed red;
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
#scan_qr_container {
  height: 300px;
  width: 300px;
  border-radius: 30px;
	border: 1px solid #311b58;
	position: absolute;
  top: 58%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
