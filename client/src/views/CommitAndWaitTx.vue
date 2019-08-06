<template>
  <!-- This component commits and tracks a transaction progress -->
  <div class="commit-and-wait-tx">
    <AeText>Please wait for your transaction to be confirmed</AeText>
    <AeText>{{ confirmPercent === NaN ? 0 : confirmPercent }}%</AeText>
    <AeLoader />
  </div>
</template>

<script>
/* eslint-disable no-console */
const WAIT_BLOCKS = parseInt(process.env.VUE_APP_MINIMUM_DEPTH);
const POLL_TIME_MSEC = 1000;
const STATUS_INITIALIZED = 0,
  STATUS_PREPARING_TX = 1,
  STATUS_WAITING = 2,
  STATUS_DONE = 3,
  STATUS_TRACK_TX_PROGRESS = 4,
  STATUS_ERROR = 0xffff;

import { AeText, AeLoader } from "@aeternity/aepp-components";

import BigNumber from "bignumber.js";
import { setInterval, setTimeout } from "timers";
import { Crypto, TxBuilder } from "@aeternity/aepp-sdk";

export default {
  name: "CommitAndWaitTx",
  components: {
    AeText,
    AeLoader
  },
  props: {
    txKind: String,
    txParams: Object
  },
  data() {
    return {
      elapsedBlocks: 0,
      viewStatus: STATUS_INITIALIZED,
      errorText: null,
      transaction: null,
      transactionHash: null
    };
  },
  watch: {},
  computed: {
    confirmPercent: function() {
      return Math.round(Math.min(100.0 * (this.elapsedBlocks / WAIT_BLOCKS), 100));
    }
  },
  methods: {
    async trackTxProgress() {
      if (this.transaction != null && this.transactionHash == null) {
        this.transactionHash = TxBuilder.buildTxHash(this.transaction);
        console.log("Obtained TX Hash: ", this.transactionHash);
      }

      try {
        this.elapsedBlocks = await this.$store.state.aeternity.getTxConfirmations(
          this.transactionHash
        );
        console.log("Elapsed TX blocks: " + this.elapsedBlocks);
        if (this.elapsedBlocks == WAIT_BLOCKS + 1) {
          // Wait +1 block  to show 100% for a moment on screen ... ;)
          await this.$store.dispatch("resetState");
          this.$router.replace("ShutdownDone");
        } else {
          setTimeout(this.trackTxProgress, POLL_TIME_MSEC);
        }
      } catch (e) {
        this.setError(e);
      }
    },
    setError(e) {
      this.$router.replace({
        name: "error",
        params: {
          errorTitle: "Sorry. We could not submit your transaction",
          errorDescription: "Reason is: " + e.toString(),
          onDismissNavTo: { name: "MainMenu" }
        },
        retryCancel: false
      });
    },

    setStatusTrackProgress(tx) {
      this.transaction = tx;
      this.viewStatus = STATUS_TRACK_TX_PROGRESS;

      setTimeout(this.trackTxProgress, POLL_TIME_MSEC);
    },
    async commitTransaction() {
      switch (this.txKind) {
        case "deposit":
          {
            console.log("Committing DEPOSIT transaction ... ");
            try {
              let tx;
              let r = await this.$store.state.aeternity.deposit(
                this.$store.state.channel,
                parseInt(this.txParams.amountAettos), // HORRIBLE CONVERSION
                async function(tx) {
                  console.log("posted deposit Onchain TX: ", tx);
                  //this.setStatusTrackProgress(tx);
                },
                async function() {
                  console.log("Deposit locked");
                  //this.setStatusTrackProgress(tx);
                }
              );
              if (r.accepted) {
                console.log("Accepted deposit");
              } else {
                throw new Error("Deposit transaction has been rejected");
              }
            } catch (error) {
              this.setError(error);
            }
          }
          break;

        case "withdraw":
          {
            console.log("Committing WITHDRAW transaction ... ");
            try {
              let tx;
              let accepted = await this.$store.state.aeternity.withdraw(
                this.$store.state.channel,
                parseInt(this.txParams.amountAettos), // HORRIBLE CONVERSION
                async function(tx) {
                  console.log("posted withdraw Onchain TX: ", tx);
                  this.setStatusTrackProgress(tx);
                }
              );
              if (accepted) {
                console.log("Accepted withdraw");
              } else {
                throw new Error("Withdraw transaction has been rejected");
              }
            } catch (error) {
              this.setError(error);
            }
          }
          break;

        case "close":
          {
            console.log("Committing CLOSE transaction ... ");
            try {
              let tx = await this.$store.state.aeternity.closeChannel(
                this.$store.state.channel
              );
              console.log("posted deposit Onchain TX: ", tx);
              this.setStatusTrackProgress(tx);
            } catch (error) {
              this.setError(error);
            }
          }
          break;

        default: {
          this.setError(
            new Error(
              "Unknown Transaction Kind provided. This is a fatal error."
            )
          );
        }
      }
    }
  },
  mounted: async function() {
    try {
      await this.commitTransaction();
      //setInterval(trackTxProgress, POLL_TIME_MSEC);
    } catch (e) {
      this.setError(e);
    }
  }
};
</script>

<style>
</style>