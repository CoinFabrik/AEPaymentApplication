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
          <AeText face="mono-base">{{ paymentData.something }}</AeText>
        </div>
      </div>
    </div>
    <AeDivider />
    <AeButton class="button" face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
    <AeButton class="button" face="round" fill="secondary" extend @click="cancel()">Cancel</AeButton>
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import { AeText, AeButton, AeDivider } from "@aeternity/aepp-components";
//import { window.eventBus } from "../event/eventbus";
import BigNumber from "bignumber.js";
import { clearInterval, setInterval } from "timers";
import HubConnection from "../controllers/hub";
import PaymentProcessor from "../controllers/payment";
const uuidv4 = require("uuid/v4");
let paymentProcessor;

export default {
  name: "ConfirmPayment",
  components: {
    AeButton,
    AeDivider,
    AeText
  },
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
      console.warn("REMEMBER TO NOT OVERWRITE UUID -- this is only for testing!");
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
                  html: "Your payment has been successfully submitted."
                })
                .then(() => {
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
                .then(() => {
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
                  .then(() => {
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
                .then(() => {
                  this.$router.replace("main-menu");
                });
            });

            paymentProcessor.send();
          }
        })
        .then(result => {
          if (result.dismiss === "timer") {
            this.$swal.fire({
              heightAuto: false,
              type: "error",
              title: "Oops!",
              html:
                "Your payment submission has timed out. This may indicate connection problems. <br> Please try again later"
            });
          }
        });
    },
    cancel() {
      this.$router.replace("main-menu");
    },
    async ensureConnection() {
      if (this.$store.state.channel.status() === "disconnected") {
        console.warn(
          "We are offline (state is DISCONNECTED), trying to reconnect... "
        );
        this.$swal
          .fire({
            type: "warning",
            title: "You are offline",
            text: "Please wait while reconnecting...",
            heightAuto: false,
            showConfirmButton: false,
            allowOutsideClick: false,
            timer: process.env.CHANNEL_RECONNECT_TIMEOUT,
            onBeforeOpen: () => {
              //this.$store.dispatch("reconnectChannel");
              this.$swal.showLoading();
              timerInterval = setInterval(() => {
                if (this.$store.state.channel.status === "open") {
                  this.$swal.close();
                }
              }, 500);
            },
            onClose: () => {
              clearInterval(timerInterval);
            }
          })
          .then(result => {
            if (result.dismiss === "timer") {
              this.$swal.fire({
                heightAuto: false,
                type: "error",
                html:
                  "We could not go online mode. This may indicate connection problems. <br> <br>" +
                  "<ul><li>Re-try again in a moment or,</li>" +
                  "<li>Ask the merchant to process the offline payment for you instead</li></ul>"
              });
            }
          });
      }
    },
    async confirm() {
      // are we connected ?
      this.ensureConnection();
      if (this.$store.state.channel.status() === "open") {
        await this.triggerPayment();
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