<template>
  <b-container class="text-area">
    <AeText
      weight="500"
      class="label"
      :face="getHeight() > 550 ? 'sans-base' : 'sans-s'"
    >
      {{ first }}
    </AeText>
    <AeText
      weight="400"
      class="label"
      :face="getHeight() > 550 ? 'sans-s' : 'sans-xs'"
    >
      {{ this.$isMerchantAppRole ? merchant : customer }}
    </AeText>
    <AeText
      v-if="final"
      weight="400"
      class="label"
      :face="getHeight() > 550 ? 'sans-base' : 'sans-xs'"
    >
      {{ final }}
    </AeText>
  </b-container>
</template>


<script>
	import { AeText } from "@aeternity/aepp-components";
	export default {
		name: "ViewDescription",
		components: { AeText },
		props: ['first', 'merchant', 'customer', 'final'],
	};
</script>

<style scoped>
	.text-area {
		/* width: 95%; */
		max-height: 30vh;
	}
	.label {
		margin-bottom: 10px;
	}
</style>
