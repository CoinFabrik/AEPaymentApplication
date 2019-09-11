<template>
  <!-- This component commits and tracks a transaction progress -->
  <div class="commit-and-wait-tx">
    <AeText>Please wait for your transaction to be confirmed</AeText>
    <AeText
      face="sans-l"
      fill="primary"
    >
      {{ confirmPercent === NaN ? 0 : confirmPercent }}%
    </AeText>
    <AeLoader v-show="confirmPercent != 100" />
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
      transactionHash: null
    };
  },
  computed: {
    confirmPercent: function() {
      return Math.round(
        Math.min(100.0 * (this.elapsedBlocks / WAIT_BLOCKS), 100)
      );
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
    async trackTxProgress() {
      if (this.transaction != null && this.transactionHash == null) {
        this.transactionHash = TxBuilder.buildTxHash(this.transaction);
        console.log("Obtained TX Hash: ", this.transactionHash);
      }

      this.elapsedBlocks = await aeternity.getTxConfirmations(
        this.transactionHash
      );
      console.log("Elapsed TX blocks: " + this.elapsedBlocks);
      if (this.elapsedBlocks >= WAIT_BLOCKS + 1) {
        // Yes, we do wait until WAIT_BLOCKS + 1 to show 100% for a little while ...

        if (
          this.$isOnDemandMode &&
          (this.txKind === "deposit" || this.tx === "withdraw")
        ) {
          this.$store.dispatch("leaveChannel");
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
              // This is a HACK!
              // (after deposit the channel will die by a bug, so we need to re-query the balances
              //  to properly display them in the main menu ....)
              
              await this.$store.dispatch("openChannel");
              await this.$store.dispatch("updateChannelBalances");
              await this.$store.dispatch("leaveChannel");
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
              // This is a HACK!
              // (after withdraw the channel will die by a bug, so we need to re-query the balances
              //  to properly display them in the main menu ....)
              await this.$store.dispatch("openChannel");
              await this.$store.dispatch("updateChannelBalances");
              await this.$store.dispatch("leaveChannel");
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
    async commitDepositTransaction() {
      console.log("Committing DEPOSIT transaction ... ");

      try {
        if (this.$isOnDemandMode) {
          await this.$store.dispatch("openChannel");
        }

        let r = await aeternity.deposit(
          this.$store.state.channel,
          parseInt(this.txParams.amountAettos), // this does not take BN as strings, BAD.
          async tx => {
            console.log("posted DEPOSIT Onchain TX: ", tx);
            this.setStatusTrackProgress(tx);
          }
        );
        if (r.accepted) {
          console.log("Accepted deposit");
        } else {
          throw new Error("Deposit transaction has been rejected");
        }
      } catch (e) {
        console.log(e.toString());
        if (this.$isOnDemandMode) {
          await this.$store.dispatch("leaveChannel");
        }
        // HACK: Interpreted as rejected by user
        if (
          e.hasOwnProperty("wsMessage") &&
          e.wsMessage.error.code === -32601
        ) {
          await this.onRejectedByUser();
          return;
        }
        throw new Error(
          "Cannot commit DEPOSIT transaction. Reason: " + e.toString()
        );
      }
    },
    async commitWithdrawTransaction() {
      console.log("Committing WITHDRAW transaction ... ");

      try {
        if (this.$isOnDemandMode) {
          await this.$store.dispatch("openChannel");
        }
        let accepted = await aeternity.withdraw(
          this.$store.state.channel,
          parseInt(this.txParams.amountAettos),
          async tx => {
            console.log("posted withdraw Onchain TX: ", tx);
            this.setStatusTrackProgress(tx);
          }
        );

        if (accepted) {
          console.log("Accepted withdraw");
        } else {
          throw new Error("Withdraw transaction has been rejected");
        }
      } catch (e) {
        if (this.$isOnDemandMode) {
          await this.$store.dispatch("leaveChannel");
        }
        // HACK: Interpreted as rejected by user
        if (
          e.hasOwnProperty("wsMessage") &&
          e.wsMessage.error.code === -32601
        ) {
          await this.onRejectedByUser();
          return;
        }
        throw new Error(
          "Cannot commit WITHDRAW transaction. Reason: " + e.toString()
        );
      }
    },
    async commitCloseTransaction() {
      console.log("Committing CLOSE transaction ... ");

      try {
        if (this.$isOnDemandMode) {
          await this.$store.dispatch("openChannel");
        }
        let tx = await aeternity.closeChannel(this.$store.state.channel);

        console.log("posted CLOSE Onchain TX: ", tx);
        this.setStatusTrackProgress(tx);
      } catch (e) {
        if (this.$isOnDemandMode) {
          await this.$store.dispatch("leaveChannel");
        }
        // HACK: Interpreted as rejected by user
        if (
          e.hasOwnProperty("wsMessage") &&
          e.wsMessage.error.code === -32601
        ) {
          await this.onRejectedByUser();
          return;
        }
        throw new Error(
          "Cannot commit WITHDRAW transaction. Reason: " + e.toString()
        );
      }
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
  }
};
</script>

<style>
</style>