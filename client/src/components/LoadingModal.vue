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
              {{text ? text : 'Loading...'}}
            </AeText>
            <AeLoader />
          </b-col>
        </b-row>
      </div>
    </b-container>
  </b-modal>
</template>


<script>
	export default {
		name: "LoadingModal",
		props: {
			alwaysVisible: Boolean,
			text: String
		},
		mounted: function() {
			if(this.alwaysVisible)
				this.$bvModal.show('loadingModal');
		}
	};
</script>

<style scoped>
	.small-box {
		height: 20vh;
	}
</style>