<template>
  <div>
    <AeText
      weight="bold"
      :face="getHeight() > 630 ? 'sans-l' : 'sans-base'"
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
			getHeight() {
				console.log(window.innerHeight)
				return window.innerHeight;
			}
		}
	};
</script>

<style scoped>
	.divider {
		margin: 2vh 15vh;
	}
</style>
