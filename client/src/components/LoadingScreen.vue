<template>
	<div :class="{ fadeout: !isLoading }">
		<div class="loader">
			<b-container class="image-splash">
				<b-row>
					<b-col md="6" offset-md="3">
						<img id="ae-logo" alt="AE-logo" src="./../assets/ae2x.png"/>
						<ae-text weight="bold" fill="white" face="sans-l">æternity</ae-text>
						<ae-text fill="white" face="sans-xs">BLOCKCHAIN</ae-text>
					</b-col>
				</b-row>
			</b-container>
		</div>
	</div>
</template>


<script>

	import { AeText } from "@aeternity/aepp-components";

	export default {
		name: "LoadingScreen",
		props: ["isLoading"],
		components: { AeText },
	};
</script>

<style>
	.image-splash {
		position: absolute;
		top: 50%;
    left: 50%;
		transform: translate(-50%, -50%);
	}

	.loader {
		background-color: #311B58;
		position: absolute;
		top: 0px;
		height: 100%;
		width: 100%;
	}

	.fadeout {
		animation: fadeout 1s forwards;
	}

	@keyframes fadeout {
		to {
			opacity: 0;
			visibility: hidden;
		}
	}
</style>