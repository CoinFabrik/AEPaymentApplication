<template>
  <b-modal id="closeModal" centered hide-footer hide-header>
    <b-container>
      <div class="d-block text-center">
        <b-row>
          <b-col>
            <AeText face="sans-l" weight="600">{{text}}</AeText>
          </b-col>
        </b-row>
        <AeDivider />
        <b-row>
          <b-col>
            <AeButton face="round" fill="neutral" @click="$bvModal.hide('closeModal')">Cancel</AeButton>
          </b-col>
          <b-col>
            <AeButton face="round" fill="secondary" @click="wrappedConfirm">Confirm</AeButton>
          </b-col>
        </b-row>
      </div>
    </b-container>
  </b-modal>
</template>


<script>
export default {
  name: "CloseModal",
  props: {
    alwaysVisible: Boolean,
    text: String,
    onConfirm: Function
  },
  methods: {
    wrappedConfirm: function() {
      this.onConfirm();
      $bvModal.hide("closeModal");
    }
  },
  mounted: function() {
    if (this.alwaysVisible) this.$bvModal.show("CloseModal");
  }
};
</script>

<style scoped>
.small-box {
  height: 20vh;
}
</style>

