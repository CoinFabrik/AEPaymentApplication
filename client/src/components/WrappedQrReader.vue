<template>
	<div
		id="scan_qr_container"
		@click="onQrClick"
	>
		<div
			id="scan_qr_subcontainer"
		>
			<QrCodeReader
				id="qr"
				v-if="!isDisabledCodeReader"
				@hasData="onQrHasData"
				@error="onQrHasError"
			/>
		</div>
	</div>
</template>

<script>
export default {
  name: "ScanQR",
  props: {
    subview: String
  },
  data() {
    return {
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
          // generate a new UUID

          if (generateNewUuid) this.qrData.id = uuidv4();
          this.navigateOut();
        }
      }
    },
    onQrHasData(scanData) {
      console.log("Obtained QR Data: " + scanData);

      // if (process.env.VUE_APP_ONBOARDING_QR_ACCEPT_ANY === 1) {
      //   this.qrData.hub = process.env.VUE_APP_TEST_HUB_IP_PORT;
      //   this.qrData.node =
      //     process.env.VUE_APP_TEST_API_SERVER_PROTO +
      //     "//" +
      //     process.env.VUE_APP_TEST_API_SERVER_ADDRESS +
      //     ":" +
      //     process.env.VUE_APP_TEST_API_SERVER_PORT;

      //   console.warn(
      //     "VUE_APP_ONBOARDING_QR_ACCEPT_ANY active. Setup simulated QR data: " +
      //       this.qrData
      //   );
      //   this.$store
      //     .dispatch("storeNetChannelParameters", this.qrData.hub)
      //     .then(() => {
      //       this.navigateOut();
      //     });
      // } else {

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
          });
        } else {
          this.qrData = JSON.parse(scanData);
          this.$store
            .dispatch("storeNetChannelParameters", this.qrData.hub)
            .then(() => this.navigateOut());
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
		cancel() {
			this.$router.back()
		}
  }
};
</script>
<style scoped>
	#scan_qr_subcontainer {
		height: 35vh;
		width: 35vh;
		border-radius: 30px;
		border: 1px dashed red;
		position: relative;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	#scan_qr_container {
		height: 40vh;
		width: 40vh;
		border-radius: 30px;
		border: 1px solid #311b58;
		position: absolute;
		top: 58%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
</style>
