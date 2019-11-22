<template>
  <div class="banner" @click="goHome()">
    <b-container>
      <div v-if="getHeight() > 500">
        <b-row align-v="center" style="height: 80px;">
          <b-col align-h="left">
            <img
              align="left"
              class="logo"
              alt="AE-logo"
              src="./../assets/images/aeternity-logo-vector-black-bg-horizontal03.svg"
            />
          </b-col>
         
          <b-col>
            <ae-text
              align="right"
              fill="primary"
              face="uppercase-base"
            >{{ this.$isMerchantAppRole ? "Merchant" : "Customer" }} <br>v{{ appVersion }}</ae-text>
          </b-col>
        </b-row>
      </div>
      <div v-else>
        <b-row align-v="center" style="height: 60px;">
          <b-col align-h="left">
            <img
              align="left"
              class="logo"
              alt="AE-logo"
              src="./../assets/images/aeternity-logo-vector-black-bg-horizontal03.svg"
            />
          </b-col>
          <b-col>
            <ae-text
              align="right"
              fill="primary"
              face="uppercase-base"
            >{{ this.$isMerchantAppRole ? "Merchant" : "Customer" }}</ae-text>
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
  computed: {
    appVersion() {
      return process.env.VUE_APP_VERSION;
    }
  },
  methods: {
    goHome() {
      this.$swal
        .fire({
          text: "Do you want to return to onboarding screen?",
          allowOutsideClick: true,
          showCancelButton: true,
          confirmButtonText: "Ok",
          cancelButtonText: "Cancel"
        })
        .then(result => {
          if (result.value) {
            this.$router.replace({ name: "connectToWallet" });
          }
        });
    },
    getHeight() {
      console.log(window.innerHeight);
      return window.innerHeight;
    }
  }
};
</script>

<style scope>
.row {
  padding-bottom: 0 !important;
}
</style>
