<template>
  <b-container class="scanqrview" />
</template>

<script>
/* eslint-disable no-console */
import BigNumber from "bignumber.js";
import { validatePurchaseQr, validateOnboardingQr } from "../util/validators";
import HubConnection from "../controllers/hub";
import aeternity from "../controllers/aeternity";
const uuidv4 = require("uuid/v4");

export default {
  name: "ScanQR",
  components: {},
  props: {
    subview: String
  },
  data() {
    return {
      qrData: null
    };
  },
  computed: {},
  async mounted() {
    if (this.subview !== "onboarding" && this.subview !== "pay-with-qr") {
      throw Error("The subview prop must be 'onboarding' or 'pay-with-qr'");
    }
    this.openScan();
  },
  methods: {
    async openScan() {
      let scandata;
      try {
        scandata = await aeternity.readQrCode(
          this.subview === "pay-with-qr"
            ? "Scan the payment request QR code from the merchant's device."
            : "Scan the QR code to open the payments channel.'"
        );

        await this.onQrHasData(scandata);
      } catch (err) {
        console.log("Scan Error: " + err);
        if (err.toString() === "Cancelled by user") {
          this.$router.back();
        } else this.onQrHasError(err);
      }
    },
    processPaymentData(data) {
      if (!validatePurchaseQr(data)) {
        this.$swal
          .fire({
            heightAuto: false,
            type: "info",
            title: "Oops...",
            text:
              "This QR Code  does not seem to contain payment information. Please try with another one."
          })
          .then(() => {
            this.openScan();
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
          this.$swal
            .fire({
              heightAuto: false,
              type: "info",
              title: "Oops...",
              text:
                "This does not seem to be a correct onboarding QR Code. Please re-scan a new one."
            })
            .then(() => {
              this.openScan();
            });
        } else {
          this.qrData = JSON.parse(scanData);
          this.navigateOut();
        }
      }
    },
    onQrHasError(error) {
      this.$displayError(
        "Oops!",
        "The QR Scanning process failed with an unexpected error. Reason is: " +
          error.toString() +
          ".  Please try again with another code"
      );
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
      }
    },
    async doOnboardingProcess() {
      this.$store.commit("loadHubIpAddr", this.qrData.hub);
      this.$store.commit("setOnboardingQrScan", true);
      this.$router.replace("register-user");
    },
    cancel() {
      this.$router.back();
    }
  }
};
</script>
