<template>
  <b-container class="confirm-payment">
    <AeText weight="bold" align="center" face="sans-l">Check your payment</AeText>
    <div class="paymentinfo">
      <div class="row">
        <div class="column">
          <AeText fill="secondary" face="sans-base">Merchant</AeText>
        </div>
        <div class="column">
          <AeText face="mono-base">{{ registeredMerchantName }}</AeText>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <AeText fill="secondary" face="sans-base">Amount</AeText>
        </div>
        <div class="column">
          <AeText face="mono-base">{{ amountAE }} AE</AeText>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <AeText fill="secondary" face="sans-base">Concept</AeText>
        </div>
        <div class="column">
          <AeText face="mono-base">{{ paymentData.something.trim().length === 0 ? "N/A" : paymentData.something }}</AeText>
        </div>
      </div>
    </div>
    <AeDivider />
    <AeButton class="margin" face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
    <AeButton class="margin" face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import BigNumber from "bignumber.js";
import { clearInterval, setInterval } from "timers";
import HubConnection from "../controllers/hub";
import PaymentProcessor from "../controllers/payment";
import aeternity from "../controllers/aeternity";
const uuidv4 = require("uuid/v4");
let paymentProcessor;

export default {
  name: "ConfirmPayment",
  props: {
    paymentData: Object
  },
  data() {
    return {
      registeredMerchantName: "N/A"
    };
  },
  computed: {
    amountAE() {
      const BN = new BigNumber(this.paymentData.amount)
        .dividedBy(new BigNumber(10).exponentiatedBy(18))
        .toString(10);
      return BN.toString();
    }
  },
  async mounted() {
    await this.queryMerchantName();
    if (this.registeredMerchantName === "N/A") {
      this.$swal.fire({
        type: "warning",
        html:
          "The merchant name for this payment could not be determined. <br>" +
          "This may indicate network problems. Dismiss this payment if you are not sure of its origin"
      });
    }
  },
  methods: {
    async queryMerchantName() {
      const hub = new HubConnection(
        this.$store.state.hubUrl,
        this.paymentData.merchant
      );
      let r = await hub.getRegisteredName("merchant");
      if (r.success) {
        this.registeredMerchantName = r.name;
      }
    },
    async triggerPayment() {
      this.paymentData.id = uuidv4();
      console.log("Generated Payment Identifier: " + this.paymentData.id);

      paymentProcessor = new PaymentProcessor(
        this.$store.getters.initiatorAddress,
        this.$store.getters.responderAddress,
        this.paymentData,
        this.$store.state.channel
      );

      this.$swal
        .fire({
          heightAuto: false,
          allowOutsideClick: false,
          type: "info",
          title: "Please wait",
          html: "While we process your payment...",
          timer: process.env.VUE_APP_CUSTOMER_PAYMENT_TIMEOUT,
          onBeforeOpen: () => {
            this.$swal.showLoading();
          },
          onOpen: () => {
            paymentProcessor.once("payment-request-completed", () => {
              this.$swal
                .fire({
                  heightAuto: false,
                  type: "success",
                  title: "Thank you",
                  html: "Your payment has been successfully sent."
                })
                .then(async () => {
                  await this.connectionLeaveIfRequired();
                  this.$router.replace("main-menu");
                });
            });

            paymentProcessor.once("payment-request-canceled", () => {
              this.$swal
                .fire({
                  heightAuto: false,
                  type: "error",
                  title: "Oops!",
                  html:
                    "The Payment Hub timed out your payment request <br> Please try again later"
                })
                .then(async () => {
                  await this.connectionLeaveIfRequired();
                  this.$router.replace("main-menu");
                });
            });

            paymentProcessor.once("payment-update-rejected-by-user", () => {
              this.$swal
                .fire({
                  heightAuto: false,
                  type: "info",
                  html: "You have cancelled your payment."
                })
                .then(async () => {
                  await this.connectionLeaveIfRequired();
                  this.$router.replace("main-menu");
                });
            });

            paymentProcessor.once(
              "payment-request-rejected",
              paymentRejectInfo => {
                this.$swal
                  .fire({
                    heightAuto: false,
                    type: "error",
                    title: "Oops!",
                    html:
                      "The Payment Hub has rejected your payment <br> Please try again later <br><br> Reason: " +
                      paymentRejectInfo
                  })
                  .then(async () => {
                    await this.connectionLeaveIfRequired();
                    this.$router.replace("main-menu");
                  });
              }
            );

            paymentProcessor.once("payment-update-rejected", () => {
              this.$swal
                .fire({
                  heightAuto: false,
                  type: "error",
                  title: "Oops!",
                  html:
                    "The transfer of funds over the channel has been rejected  <br> Please try again later"
                })
                .then(async () => {
                  await this.connectionLeaveIfRequired();
                  this.$router.replace("main-menu");
                });
            });

            paymentProcessor.send();
          }
        })
        .then(result => {
          if (result.dismiss === "timer") {
            this.$swal
              .fire({
                heightAuto: false,
                type: "error",
                title: "Oops!",
                html:
                  "Your payment submission has timed out. This may indicate connection problems. <br> Please try again later"
              })
              .then(async () => {
                await this.connectionLeaveIfRequired();
              });
          }
        });
    },
    cancel() {
      this.$router.replace("main-menu");
    },
    async connectionLeaveIfRequired() {
      try {
        if (this.$isOnDemandMode) {
          await this.$store.dispatch("leaveChannel");
        }
      } catch (e) {
        this.$swal
          .fire({
            heightAuto: false,
            type: "error",
            title: "Oops!",
            html:
              "There was a problem leaving your channel. Reason is: " +
              e.toString()
          })
          .then(() => {
            this.$router.replace("main-menu");
          });
      }
    },
    async ensureConnectionOpen() {
      if (this.$isOnDemandMode) {
        console.log("Waiting for channel to open...");
        await this.$store.dispatch("openChannel");
      }
    },
    async confirm() {
      var that = this;
      // do we have enough funds ?
      if (
        BigNumber(this.$store.state.initiatorBalance).lt(
          BigNumber(this.paymentData.amount)
        )
      ) {
        this.$swal
          .fire({
            heightAuto: false,
            allowOutsideClick: false,
            type: "warning",
            title: "Insufficient balance",
            text:
              "You don't have enough funds in your channel to purchase this item." +
              "You may deposit funds in your channel and try again."
          })
          .then(function() {
            that.$router.push({
              name: "scanqr",
              params: { subview: "pay-with-qr" }
            });
          });
      } else {
        if (this.$isOnDemandMode) {
          this.$swal.fire({
            text: "Opening channel...",
            onBeforeOpen: () => {
              this.$swal.showLoading();
            },
            allowOutsideClick: false
          });
        }
        try {
          await this.ensureConnectionOpen();
          this.triggerPayment();
        } catch (e) {
          this.$swal
            .fire({
              heightAuto: false,
              type: "error",
              title: "Oops!",
              html:
                "There was a problem opening your channel. Reason is: " +
                e.toString() +
                "<br>Please try again later"
            })
            .then(() => {
              this.$router.replace("main-menu");
            });
        }
        //this.$swal.close();
      }
    }
  }
};
</script>

<style>
.row {
  display: flex;
}

.column {
  flex: 50%;
}

.paymentinfo {
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>