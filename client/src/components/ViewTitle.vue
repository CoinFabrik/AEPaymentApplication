<template>
  <div>
    <AeText
      class="titleHead mb-3"
      weight="bold"
      :face="getHeight() > 550 ? 'sans-l' : 'sans-base'"
    >
      {{ title }}
    </AeText>
  </div>
</template>


<script>
	import { AeText } from "@aeternity/aepp-components";
	export default {
		name: "ViewTitle",
		components: { AeText },
		props: ['title'],
		methods: {
			goHome() {
				this.$router.replace({name: "connectToWallet"});
			},
		}
	};
</script>
