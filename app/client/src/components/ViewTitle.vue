<template>
  <div>
    <AeText
      class="titleHead mb-3"
      weight="bold"
      :face="getHeight() > 550 ? 'sans-l' : 'sans-base'"
      :fill=fill
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
		props: ['title', 'fill'],
		methods: {
			getHeight() {
				console.log(window.innerHeight)
				return window.innerHeight;
			}
		}
	};
</script>
