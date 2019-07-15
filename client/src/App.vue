<template>
  <div id="app">
    <!-- Offline status should ask Onboarding to base App & gathering wallet information -->
    <div v-if="isOffline">
      <Onboarding>
      </Onboarding>
    </div>
  </div>
</template>

<script>
import "@aeternity/aepp-components/dist/aepp.global.css";
import "@aeternity/aepp-components/dist/aepp.components.css";
import Onboarding from "./components/Onboarding.vue";

export default {
  name: "app",
  components: {
    Onboarding
  },
  data() {
    return {
      isOffline: true
    };
  }
};
</script>
