<template>
  <!-- This component commits and tracks a transaction progress -->
  <div class="commit-and-wait-tx">
    <AeText>Please wait for your transaction to be confirmed</AeText>
    <AeText>{{ confirmPercent === NaN ? 0 : confirmPercent }}%</AeText>
    <AeLoader />
  </div>
</template>

<script>
const WAIT_BLOCKS = process.env.VUE_APP_MINIMUM_DEPTH;
const POLL_TIME_MSEC = 500;
const STATUS_INITIALIZED = 0,
  STATUS_PREPARING_TX = 1,
  STATUS_WAITING = 2,
  STATUS_DONE = 3,
  STATUS_TRACK_TX_PROGRESS = 4,
  STATUS_ERROR = 0xffff;

import { AeText, AeLoader } from "@aeternity/aepp-components";

import BigNumber from "bignumber.js";
import { setInterval, setTimeout } from "timers";
import Crypto from "@aeternity/aepp-sdk";

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
      transaction: null
    };
  },
  watch: {},
  computed: {
    confirmPercent: function() {
      return 100.0 * (this.elapsedBlocks / WAIT_BLOCKS);
    }
  },
  methods: {
    async trackTxProgress() {
      if (this.transaction != null) {
        const th = Crypto.hash(this.transaction);
        const txinfo = await this.$store.state.aeternity.getTxInfo(th);
        console.log(txinfo);
        this.elapsedBlocks = txInfo.block_number;
        setTimeout(this.trackTxProgress, POLL_TIME_MSEC);
      }
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
              let accepted = await this.$store.state.aeternity.deposit(
                this.$store.state.channel,
                parseInt(this.txParams.amountAettos), // HORRIBLE CONVERSION
                async function(tx) {
                  console.log("posted deposit Onchain TX: ", tx);
                  this.setStatusTrackProgress(tx);
                }
              );
              if (accepted) {
                console.log("Accepted deposit");
              } else {
                throw new Error("Deposit transaction has been rejected");
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
              console.error(error);
            }
          }
          break;

        case "withdraw":
          {
          }
          break;

        default: {
          alert("unknown tx kind");
        }
      }
    }
  },
  mounted: async function() {
    try {
      await this.commitTransaction();
      //setInterval(trackTxProgress, POLL_TIME_MSEC);
    } catch (e) {
      setError(e);
    }

    // Prepare transaction

    // setInterval(() => {
    //   this.elapsedBlocks++;
    //   if (this.elapsedBlocks == WAIT_BLOCKS) {
    //     this.$router.push({ name: "success", params: { txKind: this.txKind } });
    //   }
    // }, POLL_TIME_MSEC);
  }
};
</script>

<style>
</style>