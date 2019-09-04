<template>
  <div>
    <AeText
      weight="bold"
      face="sans-l"
    >
      {{ title }}
    </AeText>
    <AeDivider class="divider" />
  </div>
</template>


<script>
	import { AeText, AeDivider } from "@aeternity/aepp-components";
	export default {
		name: "ViewTitle",
		components: { AeText, AeDivider },
		props: ['title'],
		methods: {
			goHome() {
				this.$router.replace({name: "connectToWallet"});
			},
		}
	};
</script>

<style scoped>
	.divider {
		margin: 20px 150px;
	}
</style>
