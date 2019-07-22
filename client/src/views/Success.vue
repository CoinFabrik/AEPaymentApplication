<template>
  <div class="success">
    <AeText>{{ properInfoText }}</AeText>
    <ae-icon fill="secondary" face="round" name="check" />
    <AeDivider />
    <AeButton fill="primary" face="round" @click="dismiss()">Dismiss</AeButton>
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
      properInfoText: function () {
        // Return a proper informational text
        // according to transaction kind.
        //

        switch (this.txKind) {
          case 'initial-deposit':
            return "Your initial deposit transaction has been confirmed";

          case 'deposit':
            return "Your deposit into the channel transaction has been confirmed";

          case 'close-channel':
            return "The channel to PoS service has been successfully closed.";

          default:
            return "Unknown txKind";
        }
      }
    },
    methods: {
      dismiss: function () {
        switch (this.txKind) {
          case 'initial-deposit':
            this.$router.replace('mainmenu');
            break;
          case 'deposit':
            this.$router.replace('mainmenu');
            break;
          case 'close-channel':
            this.$router.replace('onboarding');
            break;

          default:
            this.$router.replace('mainmenu');
        }
      }
    },
    mounted: function () {
    }
  };
</script>

<style>

</style>