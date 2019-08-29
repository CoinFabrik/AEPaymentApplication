<template>
  <b-modal
    id="loadingModal"
    centered
    hide-footer
    hide-header
  >
    <b-container>
      <div class="d-block text-center">
        <b-row>
          <b-col>
            <AeText
              face="sans-l"
              weight="600"
            >
              Loading...
            </AeText>
            <AeLoader />
          </b-col>
        </b-row>
      </div>
    </b-container>
  </b-modal>
</template>


<script>
	import { AeLoader, AeText } from "@aeternity/aepp-components";
	export default {
		name: "LoadingModal",
		components: { AeLoader, AeText },
	};
</script>

<style scoped>
	.small-box {
		height: 20vh;
	}
</style>


