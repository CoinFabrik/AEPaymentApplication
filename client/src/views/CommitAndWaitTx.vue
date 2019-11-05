<template>
  <!-- This component commits and tracks a transaction progress -->
  <div class="commit-and-wait-tx">
    <ViewTitle fill="primary" :title="getHeaderTitle" />

    <div v-if="rehydratingChannelObject">
      <AeText face="sans-s">Restablishing channel, please wait...</AeText>
      <br />
      <AeLoader />
    </div>
    <div v-else>
      <div v-if="elapsedBlocks < 0">
        <AeText face="sans-s">Waiting confirmations from the blockchain...</AeText>
      </div>
      <div v-else>
        <AeText face="sans-s">Waiting confirmations from the blockchain ({{this.elapsedBlocks}} of {{this.minimum_depth}})...</AeText>
      </div>
      <br />

      <AeLoader v-show="txConfirmed === false" />
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
  </div>
</template>

<script>
/* eslint-disable no-console */
const POLL_TIME_MSEC = 1000;
const STATUS_INITIAL = 0,
  STATUS_TRACK_TX_PROGRESS = 1,
  STATUS_CONFIRMED = 2,
  STATUS_CANCELLED_BY_USER = 3,
  STATUS_ERROR = 255;
import aeternity from "../controllers/aeternity";
import { setTimeout } from "timers";
import { TxBuilder } from "@aeternity/aepp-sdk";
import { sleep, trimHash } from "../util/tools";
import copy from "copy-to-clipboard";
import NoSleep from "nosleep.js";
import saveState from "vue-save-state";

let noSleep = new NoSleep();

export default {
  mixins: [saveState],
  name: "CommitAndWaitTx",
  props: {
    txKind: String,
    txParams: Object
  },
  data() {
    return {
      elapsedBlocks: 0,
      viewStatus: STATUS_INITIAL,
      transaction: null,
      transactionHash: null,
      hashCopied: false,
      onchainTxLocked: false,
      rehydratingChannelObject: false
    };
  },
  computed: {
    minimum_depth: function() {
      return this.$store.state.channelOptions.minimum_depth;
    },
    confirmPercent: function() {
      return Math.round(
        Math.min(100.0 * (this.elapsedBlocks / this.minimum_depth()), 100)
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
        return this.elapsedBlocks >= this.minimum_depth();
      } else if (this.txKind === "deposit" || this.txKind === "withdraw") {
        return (
          this.onchainTxLocked ||
          this.elapsedBlocks >= this.minimum_depth()
        );
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
    switch (this.viewStatus) {
      case STATUS_INITIAL:
        try {
          this.noSleep = new NoSleep();
          await this.commitTransaction();
        } catch (e) {
          this.viewStatus = STATUS_ERROR;
          this.showError(e);
        }
        break;

      case STATUS_ERROR:
        this.showError(e);
        break;

      case STATUS_CONFIRMED:
        await this.confirmAndNavigateOut();
        break;

      case STATUS_TRACK_TX_PROGRESS:
        await this.rehydrateChannelObject();
        this.trackTxProgress();
        break;

      case STATUS_CANCELLED_BY_USER:
        this.showCanceledByUser();
        break;
    }
  },
  methods: {
    async rehydrateChannelObject() {
      // if (window.channel == null || typeof window.channel === "undefined") {
      //   try {
      //     this.rehydratingChannelObject = true;
      //     await this.$store.dispatch("openChannel", true);
      //     this.rehydratingChannelObject = false;
      //   } catch (e) {
      //     this.viewStatus = STATUS_ERROR;
      //     this.rehydratingChannelObject = false;
      //     showError(e);
      //   }
      // }
    },
    resetView() {
      this.elapsedBlocks = 0;
      this.viewStatus = STATUS_INITIAL;
      this.transaction = null;
      this.transactionHash = null;
      this.hashCopied = false;
      this.onchainTxLocked = false;
    },
    getSaveStateConfig() {
      return {
        cacheKey: "payapp.view.CommitAndWaitTx",
        ignoreProperties: ["hashCopied", "elapsedBlocks"]
      };
    },
    showError(e) {
      this.$displayError(
        "Oops!",
        "We could not submit your " +
          this.txKind +
          " transaction. " +
          "Reason: " +
          e.toString()
      );
      this.$router.replace("main-menu");
      this.resetView();
    },
    showCanceledByUser() {
      this.$swal.fire({
        type: "info",
        text: "You cancelled your request.",
        onClose: async () => {
          await this.$router.replace("main-menu");
          this.resetView();
        }
      });
    },
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
      try {
        this.elapsedBlocks = await aeternity.getTxConfirmations(
          this.transactionHash
        );
      } catch (e) {
        console.error(
          "Cannot get TX confirmations. Reason: " +
            e.toString() +
            "... RETRYING."
        );
        setTimeout(this.trackTxProgress, POLL_TIME_MSEC);
      }

      console.log("Elapsed TX blocks: " + this.elapsedBlocks);

      if (this.txConfirmed) {
        this.viewStatus = STATUS_CONFIRMED;
        if 
          (this.txKind === "deposit" || this.tx === "withdraw")
         {
          await this.$store.dispatch("openChannel", true);
          await this.$store.dispatch("updateChannelBalances");
          await this.$store.dispatch("leaveChannel");
        }
        this.confirmAndNavigateOut();
      } else {
        setTimeout(this.trackTxProgress, POLL_TIME_MSEC);
      }
    },
    async confirmAndNavigateOut() {
      this.resetView();

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
                name: "connect-to-wallet"
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
      setTimeout(this.trackTxProgress, POLL_TIME_MSEC);
    },
    async onRejectedByUser() {
      this.viewStatus = STATUS_CANCELLED_BY_USER;
      this.showCanceledByUser();
    },
    async commitTransaction() {
      console.log("Committing " + this.txKind + " transaction ... ");
      let func, params, callbacks;

      const onChainCallback = async tx => {
        if (this.viewStatus === STATUS_TRACK_TX_PROGRESS) {
          console.log("Already received, Ignoring this onChain Callback");
        } else {
          console.log("Posted " + this.txKind + " Onchain TX: ", tx);
          this.noSleep.enable();
          this.setStatusTrackProgress(tx);
        }
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

      await this.$store.dispatch("openChannel", true);

      func(window.channel, ...params, ...callbacks)
        .then(r => {
          if (r.accepted) {
            console.log("Accepted transaction");
          } else {
            this.noSleep.disable();
            this.viewStatus = STATUS_ERROR;
            throw new Error("This transaction has been rejected");
          }
        })
        .catch(e => {
          this.noSleep.disable();
          console.log(e.toString());
          if (aeternity.rejectedByUser) {
              // trigger conflict to reset state
              func(window.channel, ...params, ...callbacks).catch(e => {
                console.log("Conflict-trigger delivered: " + e.toString());
                if (e.error.code === 3) {
                  this.onRejectedByUser();
                }
              });
              throw e;
                this.$store.dispatch("leaveChannel");
            return;
          }
        });
    }
  }
};
</script>

<style>
</style>