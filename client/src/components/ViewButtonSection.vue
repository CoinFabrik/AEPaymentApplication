<template>
  <div class="footer buttonsection">
    <div v-for="btn in buttons">
      <AeButton
        class="marginal"
        face="round"
        :fill="btn['cancel'] ? 'neutral' : 'primary'"
        extend
        @click="btn['action']"
        :disabled="btn['validator'] !== undefined && !btn['validator']"
      >{{ btn['name'] }}</AeButton>
    </div>
  </div>
</template>


<script>

export default {
  name: "ViewButtonSection",
  props: ["buttons"],
  computed: {
    isDisabled() {
      return ;
    }
  }
};
</script>

<style scoped>
.buttonsection {
  margin-bottom: 30px !important;
}
.marginal {
  margin-top: 10px;
}
</style>
