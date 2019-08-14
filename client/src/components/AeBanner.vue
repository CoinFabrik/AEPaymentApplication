<template>
	<div id="banner">
		<img id="ae-logo" alt="AE-logo" src="./../assets/ae2x.png" />
		<ae-text weight="bold" fill="white" face="sans-l">æternity</ae-text>
	</div>
</template>


<script>
	import { AeText } from "@aeternity/aepp-components";

	export default {
		name: "AeBanner",
		components: { AeText }
	};
</script>

<style>
	#banner {
		height: 15%;
	}
	#ae-logo {
		padding-top: 10px;
		height: 55%;
	}
</style>
