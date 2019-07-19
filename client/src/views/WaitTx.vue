<template>
    <div class="wait-tx" >
        <AeText >Please wait for your transaction to be confirmed</AeText>
        <AeText >{{ confirmPercent }}%</AeText>
        <AeLoader/>
    </div>
</template>

<script>

const WAIT_BLOCKS = 8
const BLOCK_TIME_MSEC = 600

import aeternity from '../controllers/network.js'
import {
  AeText,
  AeLoader
} from "@aeternity/aepp-components";

export default {
  name: "WaitTx",
  components: {
    AeText,
    AeLoader
  },
  props: {
    txKind: String
  },
  data() {
    return {
      elapsedBlocks: 0
    };
  },
  watch: {

  },
  computed: {
    confirmPercent: function () { return 100.0 * (this.elapsedBlocks / WAIT_BLOCKS); }
  },
  methods: {
    update() {
      
    }
  },
  mounted: function() {
    setInterval(() => { 
        this.elapsedBlocks++;
        if (this.elapsedBlocks == WAIT_BLOCKS){
          this.$router.push( { name: 'success', params: { txKind: this.txKind }})
        } 
    }, BLOCK_TIME_MSEC)
  }
};
</script>

<style>

</style>