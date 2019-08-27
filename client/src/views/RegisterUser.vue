<template>
  <b-container class="register-merch">
    <AeText
      weight="bold"
      face="sans-l"
    >
      Register
    </AeText>
    <br>
    <AeDivider />
    <br>
    <AeText
      weight="bold"
      face="sans-s"
    >
      {{ this.$isMerchantAppRole ? "What is the name of your store?" : "What is your name?" }}
    </AeText>
    <AeText
      face="sans-xs"
    >
      This name will allow others to identify your payments or payment requests.
    </AeText>
    <br>
    <AeInput
      v-show="!fetchingName"
      ref="inputName"
      v-model="nameInput"
      placeholder="Name..."
    />
    <AeLoader v-show="fetchingName" />
    <br>
    <AeButton
      v-show="!fetchingName"
      face="round"
      fill="primary"
      extend
      @click="confirm()"
    >
      Confirm
    </AeButton>
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import HubConnection from "../controllers/hub";
import {
  AeText,
  AeButton,
  AeInput,
	AeLoader,
	AeDivider
} from "@aeternity/aepp-components";

export default {
  name: "RegisterUser",
  components: {
    AeButton,
    AeText,
    AeLoader,
		AeInput,
		AeDivider
  },
  props: {},
  data() {
    return {
      fetchingName: false,
      nameInput: ""
    };
  },
  computed: {
    isValidInput() {
      return this.nameInput.length > 0;
    }
  },
  async mounted() {
    try {
      this.fetchingName = true;
      let hubConnection = new HubConnection(
        this.$store.state.hubUrl,
        this.$store.getters.initiatorAddress
      );
      let res = await hubConnection.getRegisteredName(
        this.$isClientAppRole ? "client" : "merchant"
      );

      if (!res.success) {
        throw new Error(res.error);
      }

      if (res.name !== undefined || res.name.length > 0) {
        console.log("Found Name at Hub for this address: " + res.name);
        this.nameInput = res.name;
        this.fetchingName = false;
      }
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
