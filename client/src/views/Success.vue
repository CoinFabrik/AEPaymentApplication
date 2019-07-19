<template>
    <div class="success" >
        <AeText >{{ properInfoText }}</AeText>
        <ae-icon fill="secondary" face="round" name="check" />
        <AeDivider/>
        <AeButton fill="primary" face="round">Dismiss</AeButton>
    </div>
</template>

<script>
import aeternity from '../controllers/network.js'
import {
  AeText,
  AeButton,
  AeDivider,
  AeIcon
} from "@aeternity/aepp-components";

export default {
  name: "Success",
  components: {
    AeText,
    AeButton,
    AeDivider,
    AeIcon
  },
  props: {
      txKind: String
  },
  data() {
    return {
      elapsedBlocks: 0
    };
  },
  computed: {
      properInfoText: function() {
          // Return a proper informational text
          // according to transaction kind.
          //
    
          switch (this.txKind) {
              case 'initial-deposit':
                  return "Your initial deposit transaction has been confirmed";
                  break;
              case 'deposit':
                  return "Your deposit into the channel transaction has been confirmed";
                  break;
              default:
                  return "Your requested transaction has been confirmed"
          }
      }
  },
  methods: {
  },
  mounted: function() {
  }
};
</script>

<style>

</style>