<template>
  <!-- This component commits and tracks a transaction progress -->
  <div class="commit-and-wait-tx">
    <ViewTitle fill="primary" :title="getHeaderTitle" />
    <AeText face="sans-s">Waiting confirmations from the blockchain...</AeText>
    <br />

    <AeLoader v-show="confirmPercent != 100" />
    <br />
    <AeText face="sans-xs" v-show="this.transactionHash !== null">
      <br />On-chain transaction hash (click to copy)
      <b
        :style="{ color: hashColor }"
        @click="copyHash"
      >{{ this.prettyHash }}</b>
    </AeText>
    <br />
  </div>
</template>

<script>
/* eslint-disable no-console */
const WAIT_BLOCKS = parseInt(process.env.VUE_APP_MINIMUM_DEPTH);
const POLL_TIME_MSEC = 1000;
const STATUS_INITIALIZED = 0,
  STATUS_TRACK_TX_PROGRESS = 1;
import aeternity from "../controllers/aeternity";
import { setTimeout } from "timers";
import { TxBuilder } from "@aeternity/aepp-sdk";
import { sleep, trimHash } from "../util/tools";
import copy from "copy-to-clipboard";

export default {
  name: "CommitAndWaitTx",
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
      transactionHash: null,
      hashCopied: false,
      onchainTxLocked: false
    };
  },
  computed: {
    confirmPercent: function() {
      return Math.round(
        Math.min(100.0 * (this.elapsedBlocks / WAIT_BLOCKS), 100)
      );
    },
    hashColor() {
      return this.hashCopied ? "#e4416f" : "#000000";
    },
    prettyHash() {
      return this.transactionHash && this.transactionHash !== null
        ? trimHash(this.transactionHash)
        : "";
    },
    txConfirmed() {
      if (this.txKind === "close") {
        return this.elapsedBlocks >= WAIT_BLOCKS;
      } else if (this.txKind === "deposit" || this.txKind === "withdraw") {
        return this.onchainTxLocked;
      } else throw new Error("Transaction type is unknown");
    },
    getHeaderTitle() {
      switch (this.txKind) {
        case "deposit":
          return "Deposit in progress, please wait...";
          break;

        case "withdraw":
          return "Withdraw in progress, please wait...";
          break;

        case "close":
          return "Channel close in progress, please wait...";
          break;

        default:
          throw new Error("Transaction type is unknown");
      }
    }
  },
  watch: {},
  mounted: async function() {
    try {
      await this.commitTransaction();
    } catch (e) {
      this.displayError(e);
      this.$router.replace("main-menu");
    }
  },
  mounted: async function() {
    try {
      await this.commitTransaction();
    } catch (e) {
      this.$displayError(
        "Oops!",
        "We could not submit your " +
          this.txKind +
          " transaction. " +
          "Reason: " +
          e.toString()
      );
      this.$router.replace("main-menu");
    }
  },
  methods: {
    copyHash() {
      if (copy(this.transactionHash)) {
        this.hashCopied = true;
      }
    },
    async trackTxProgress() {
      if (this.transaction != null && this.transactionHash == null) {
        this.transactionHash = TxBuilder.buildTxHash(this.transaction);
        console.log("Obtained TX Hash: ", this.transactionHash);
      }

      this.elapsedBlocks = await aeternity.getTxConfirmations(
        this.transactionHash
      );
      console.log("Elapsed TX blocks: " + this.elapsedBlocks);

      if (this.txConfirmed) {
        if (
          this.$isOnDemandMode &&
          (this.txKind === "deposit" || this.tx === "withdraw")
        ) {
          await this.$store.dispatch("updateChannelBalances");
          await this.$store.dispatch("leaveChannel");
        }
        this.navigateOut();
      } else {
        setTimeout(this.trackTxProgress, POLL_TIME_MSEC);
      }
    },
    async navigateOut() {
      switch (this.txKind) {
        case "deposit":
          await this.$swal.fire({
            type: "success",
            title: "Success",
            text: "Your deposit transaction has been successfully confirmed. ",
            onClose: async () => {
              this.$router.replace("main-menu");
            }
          });

          break;

        case "withdraw":
          await this.$swal.fire({
            type: "success",
            title: "Success",
            text: "Your withdraw transaction has been successfully confirmed. ",
            onClose: async () => {
              this.$router.replace("main-menu");
            }
          });
          break;

        case "close":
          await this.$swal.fire({
            type: "success",
            title: "Thanks for operating with our service",
            text:
              "If you want to operate with our Payment service again, you will need to redo the onboarding steps.",
            onClose: async () => {
              await this.$store.dispatch("resetState");
              await this.$router.replace({
                name: "scanqr",
                params: { subview: "onboarding" }
              });
            }
          });
          break;

        default:
          throw new Error("Transaction type is unknown");
      }
    },
    setStatusTrackProgress(tx) {
      this.transaction = tx;
      this.viewStatus = STATUS_TRACK_TX_PROGRESS;

      /* Note that we track Close and Deposit/Withdraw differently.
         With "Close" we will wait for VUE_APP_MINIMUM_DEPTH blocks.
         With Withdraw / Deposit we will wait for the OnOwnWithdrawLocked/OnOwnDepositLocked callbacks 
         to trigger the "transaction confirmed" notification */

      setTimeout(this.trackTxProgress, POLL_TIME_MSEC);
    },
    async onRejectedByUser() {
      this.$swal.fire({
        type: "info",
        text: "You cancelled your request.",
        onClose: async () => {
          if (this.$isOnDemandMode) {
            await this.$store.dispatch("leaveChannel");
          }
          await this.$router.replace("main-menu");
        }
      });
    },
    async commitTransaction() {
      console.log("Committing " + this.txKind + " transaction ... ");
      let func, params, callbacks;

      const onChainCallback = async tx => {
        console.log("Posted " + this.txKind + " Onchain TX: ", tx);
        this.setStatusTrackProgress(tx);
      };

      const onLockedTxCallback = () => {
        console.log("Onchain " + this.txKind + " locked event");
        this.onchainTxLocked = true;
      };

      switch (this.txKind) {
        case "deposit":
          func = aeternity.deposit;
          params = [this.txParams.amountAettos];
          callbacks = [onChainCallback, onLockedTxCallback];
          break;

        case "withdraw":
          func = aeternity.withdraw;
          params = [this.txParams.amountAettos];
          callbacks = [onChainCallback, onLockedTxCallback];
          break;

        case "close":
          func = aeternity.closeChannel;
          params = [];
          callbacks = [onChainCallback];
          break;
      }

      try {
        if (this.$isOnDemandMode) {
          await this.$store.dispatch("openChannel");
        }

        let r = await func(this.$store.state.channel, ...params, ...callbacks);
        console.log(r);
        if (r.accepted) {
          console.log("Accepted transaction");
        } else {
          throw new Error("This transaction has been rejected");
        }
      } catch (e) {
        console.log(e.toString());
        if (aeternity.rejectedByUser) {
          if (this.$isOnDemandMode) {
            await this.$store.dispatch("leaveChannel");
          }
          await this.onRejectedByUser();
          return;
        }

        throw new Error("Cannot commit transaction. Reason: " + e.toString());
      }
    }
  }
};
</script>

<style>
</style>