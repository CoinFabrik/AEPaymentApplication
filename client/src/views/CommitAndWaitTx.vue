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
  STATUS_TRACK_TX_PROGRESS = 1;

import { AeText, AeLoader } from "@aeternity/aepp-components";

import { setTimeout } from "timers";
import { TxBuilder } from "@aeternity/aepp-sdk";
import { EventBus } from "../event/eventbus.js";

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
      return Math.round(
        Math.min(100.0 * (this.elapsedBlocks / WAIT_BLOCKS), 100)
      );
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
        this.displayError(e);
      }
    },
    displayError(e) {
      this.$swal.fire({
        heightAuto: false,
        type: "error",
        title: "Oops!",
        text:
          "We could not submit your " +
          this.txKind +
          " transaction. " +
          "Reason: " +
          e.toString()
      });
    },

    setStatusTrackProgress(tx) {
      this.transaction = tx;
      this.viewStatus = STATUS_TRACK_TX_PROGRESS;

      setTimeout(this.trackTxProgress, POLL_TIME_MSEC);
    },
    async commitDepositTransaction() {
      console.log("Committing DEPOSIT transaction ... ");

      let r = await this.$store.state.aeternity.deposit(
        this.$store.state.channel,
        parseInt(this.txParams.amountAettos), // this does not take BN as strings, BAD.
        async function(tx) {
          console.log("posted DEPOSIT Onchain TX: ", tx);
          this.setStatusTrackProgress(tx);
        }
      );
      if (r.accepted) {
        console.log("Accepted deposit");
      } else {
        throw new Error("Deposit transaction has been rejected");
      }
    },
    async commitWithdrawTransaction() {
      console.log("Committing WITHDRAW transaction ... ");

      let accepted = await this.$store.state.aeternity.withdraw(
        this.$store.state.channel,
        parseInt(this.txParams.amountAettos),
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
    },
    async commitCloseTransaction() {
      console.log("Committing CLOSE transaction ... ");

      let tx = await this.$store.state.aeternity.closeChannel(
        this.$store.state.channel
      );
      console.log("posted CLOSE Onchain TX: ", tx);
      this.setStatusTrackProgress(tx);

      EventBus.$emit("desuscribe-channel");
    },
    async commitTransaction() {
      switch (this.txKind) {
        case "deposit":
          await this.commitDepositTransaction();
          break;

        case "withdraw":
          await this.commitWithdrawTransaction();
          break;

        case "close":
          await this.commitCloseTransaction();
          break;

        default:
          throw new Error("Transaction type is unknown");
      }
    }
  },
  mounted: async function() {
    try {
      await this.commitTransaction();
    } catch (e) {
      this.displayError(e);
      this.$router.replace("main-menu");
    }
  }
};
</script>

<style>
</style>