<template>
	<div id="banner" v-on:click="goHome()">
		<img id="ae-logo" alt="AE-logo" src="./../assets/ae2x.png" />
		<ae-text weight="bold" fill="white" face="sans-l">æternity</ae-text>
		<ae-text fill="primary" face="uppercase-xs">{{ this.$isMerchantAppRole ? "merchant wallet" : "customer wallet" }}</ae-text>
	</div>
</template>


<script>
	import { AeText } from "@aeternity/aepp-components";

	export default {
		name: "AeBanner",
		components: { AeText },
		methods: {
			goHome() {
				this.$router.replace({name: "connectToWallet"});
			},
		}
	};
</script>

<style>
	#banner {
		height: 18vh;
	}
	#ae-logo {
		padding-top: 10px;
		height: 55%;
	}
</style>
