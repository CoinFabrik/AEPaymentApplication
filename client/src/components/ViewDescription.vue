<template>
  <div class="text-area">
    <AeText
      weight="500"
      class="label"
      :face="getHeight() > 630 ? 'sans-base' : 'sans-s'"
    >
      {{ first }}
    </AeText>
    <AeText
      weight="400"
      class="label"
      :face="getHeight() > 630 ? 'sans-base' : 'sans-xs'"
    >
      {{ this.$isMerchantAppRole ? merchant : customer }}
    </AeText>
    <AeText
      v-if="final"
      weight="400"
      class="label"
      :face="getHeight() > 630 ? 'sans-base' : 'sans-xs'"
    >
      {{ final }}
    </AeText>
  </div>
</template>


<script>
	import { AeText } from "@aeternity/aepp-components";
	export default {
		name: "ViewDescription",
		components: { AeText },
		props: ['first', 'merchant', 'customer', 'final'],
		methods: {
			getHeight() {
				return window.innerHeight;
			}
		}
	};
</script>

<style scoped>
	.text-area {
		width: 95%;
		max-height: 30vh;
	}
	.label {
		margin-bottom: 10px;
	}
</style>
