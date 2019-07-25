<template>
  <div></div>
</template>

<script>
/* eslint-disable no-console */
const POLL_INTERVAL_MS = 1000;
//import { AeText, AeIcon } from "@aeternity/aepp-components";

import "sweetalert2/dist/sweetalert2.min.css";
export default {
  name: "ChannelNotify",
  components: {
    
  },
  data() {
    return {
      messageQueue: []
    };
  },
  props: {},
  methods: {
    onChannelStatusChange() {},
    onChannelMessage(msg) {
      console.log("PoS Message received: ", msg);
      this.messageQueue.push(msg);
    },
    checkMessageQueue() {
      if (this.messageQueue.length > 0) {
        const msg = this.messageQueue.pop();
        console.log("Message found in queue: ");
        console.log(msg);

        // Decode message

        const infoObj = JSON.parse(msg.info);
        if (infoObj.kind === "request_payment") {
           this.$swal({
          title: 'Are you sure?',
          text: 'Do you want to PAY ' + infoObj.amount + " Æ for your PURCHASE at " + infoObj.seller + "?",
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Pay',
          cancelButtonText: 'Reject',
          showCloseButton: false,
          showLoaderOnConfirm: true
        }).then((result) => {
          if(result.value) {
            this.$swal('Deleted', 'You successfully deleted this file', 'success')
          } else {
            this.$swal('Cancelled', 'You cancelled your purchase', 'info')
          }
        })
        }
      }
      setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
    }
  },
  mounted() {
    this.$store.state.channel.on("statusChanged", this.onChannelStatusChange);
    this.$store.state.channel.on("message", this.onChannelMessage);
    setTimeout(this.checkMessageQueue, POLL_INTERVAL_MS);
  },
  destroyed() {
    this.$store.state.channel.removeListener("message", this.onChannelMessage);
    this.$store.state.channel.removeListener(
      "statusChanged",
      this.onChannelStatusChange
    );
  }
};
</script>

<style>
</style>
