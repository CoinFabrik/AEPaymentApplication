<template>
  <b-container class="register-merch">
    <AeText weight="bold" face="sans-s">Before we begin, you need to register a name to identify yourself or your business.</AeText>
    <AeText face="sans-xs"
    >Entering your name enables customers and merchants to track the transactions between them</AeText>
    <AeInput
      v-show="!fetchingName"
      ref="inputName"
      placeholder="Your personal or business identity name"
      v-model="nameInput"
    ></AeInput>
    <AeLoader v-show="fetchingName" />

    <AeButton v-show="!fetchingName" face="round" fill="primary" extend @click="confirm()">Confirm</AeButton>
  </b-container>
</template>

<script>
/* eslint-disable no-console */

import HubConnection from "../controllers/hub";
import {
  AeText,
  AeButton,
  AeInput,
  AeLoader
} from "@aeternity/aepp-components";

export default {
  name: "RegisterUser",
  components: {
    AeButton,
    AeText,
    AeLoader,
    AeInput
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
  methods: {
    confirm() {
      this.$store.commit("setUserName", this.nameInput);
      this.$router.replace({
        name: "deposit",
        params: {
          initialDeposit: true
        }
      });
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
          e.toString()
      );
      this.fetchingName = false;
    }
  }
};
</script>
