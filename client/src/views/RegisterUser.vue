<template>
  <b-container class="register-merch">
    <ViewTitle
      title="Identify yourself"
    />
    <ViewDescription
      :first="this.$isMerchantAppRole ? 'Enter the name of your store' : 'Enter your name'"
      customer="This name will allow merchants to identify your payments."
      merchant="This name will allow customers to identify your payment requests."
    />

    <AeInput
      class="mt-4"
      v-show="!fetchingName"
      ref="inputName"
      v-model="nameInput"
      placeholder="Your name..."
    />
    <AeLoader v-show="fetchingName" />

    <ViewButtonSection
      :buttons="[{name: 'Confirm', action: confirm, validator: isValidInput}]"
    />
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import HubConnection from "../controllers/hub";
import aeternity from '../controllers/aeternity'
export default {
  name: "RegisterUser",
  data() {
    return {
      fetchingName: false,
      nameInput: ""
    };
  },
  computed: {
    isValidInput() {
      return this.nameInput.trim().length > 0;
    }
  },
  async mounted() {
    try {
      this.fetchingName = true;
      let hubConnection = new HubConnection(
        this.$store.state.hubUrl,
        await aeternity.getAddress()
      );
      let res = await hubConnection.getRegisteredName(
        this.$isClientAppRole ? "client" : "merchant"
      );

      if (!res.success) {
        throw new Error(res.error);
      }

      if (res.name != null && (res.name !== undefined || res.name.length > 0)) {
        console.log("Found Name at Hub for this address: " + res.name);
        this.nameInput = res.name;
      }


        this.fetchingName = false;
    } catch (e) {
      this.$displayError(
        "Oops!",
        "We could not connect to the payment hub to query your name. Please try again later. " +
          "Reason: " +
          e.toString(),
        () => {
          this.$router.replace({
            name: "scanqr",
            params: { subview: "onboarding" }
          });
        }
      );

      this.fetchingName = false;
    }
  },
  methods: {
    confirm() {
      this.$store.commit("setUserName", this.nameInput);
      this.$router.push({
        name: "deposit",
        params: {
          initialDeposit: true
        }
      });
    }
  }
};
</script>
