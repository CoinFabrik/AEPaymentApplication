<template>
  <div
    class="banner"
    @click="goHome()"
  >
		<b-container>
			<div v-if="getHeight() > 500">
				<img
					class="logo"
					alt="AE-logo"
					src="./../assets/ae2x.png"
				>
				<ae-text
					weight="bold"
					fill="white"
					face="sans-s"
				>
					æternity
				</ae-text>
				<ae-text
					fill="primary"
					face="mono-xs"
				>
					{{ this.$isMerchantAppRole ? "MERCHANT" : "CUSTOMER" }}
				</ae-text>
			</div>
			<div v-else>
				<b-row align-h="center">
					<b-col align-v="center">
						<img
							class="logo"
							alt="AE-logo"
							src="./../assets/ae2x.png"
						>
					</b-col>
					<b-col align-v="center">
						<ae-text
							weight="bold"
							fill="white"
							face="sans-s"
						>
							æternity
						</ae-text>
						<ae-text
							fill="primary"
							face="mono-xs"
						>
							{{ this.$isMerchantAppRole ? "MERCHANT" : "CUSTOMER" }}
						</ae-text>
					</b-col>
				</b-row>
			</div>
		</b-container>
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
			getHeight() {
				console.log(window.innerHeight)
				return window.innerHeight;
			}
		}
	};
</script>

<style>
@media only screen and (min-width: 530)
	.banner {
		height: 12vh;
	}
@media only screen and (min-width: 530)
	.banner {
		height: 15vh;
	}
	.logo {
		padding-top: 10px;
		height: 9vh;
	}
</style>
