<template>
  <b-container class="register-merch">
    <ViewTitle title="Identify yourself" />
    <ViewDescription
      :first="this.$isMerchantAppRole ? 'Enter the name of your store' : 'Enter your name'"
      customer="This name will allow merchants to identify your payments."
      merchant="This name will allow customers to identify your payment requests."
    />

    <AeInput
      v-show="!fetchingName"
      ref="inputName"
      v-model="nameInput"
      label="Enter your name"
      placeholder="Your name..."
      class="mt-4"
    />
    <AeLoader v-show="fetchingName" />

    <ViewButtonSection
      :buttons="[{name: 'Confirm', action: confirm, fill:'primary', disabled: !isValidInput}]"
    />
  </b-container>
</template>

<script>
/* eslint-disable no-console */
let hubConnection;
import HubConnection from "../controllers/hub";
import aeternity from "../controllers/aeternity";
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
      this.hubConnection = new HubConnection(
        this.$store.state.hubUrl,
        await aeternity.getAddress()
      );
      let res = await this.hubConnection.getRegisteredName(
        process.env.VUE_APP_ROLE
      );

      if (!res.success) {
        throw new Error(res.error);
      }

      if (
        res.name != "null" &&
        res.name != null &&
        (res.name !== undefined || res.name.length > 0)
      ) {
        console.log("Found Name at Hub for this address: " + res.name);
        this.nameInput = res.name;
      }

      this.fetchingName = false;
    } catch (e) {
      this.$displayError(
        "Oops!",
        "We could not connect to the payment hub to query your name. Please try again later. ",
        () => {
          if (process.env.VUE_APP_AUTO_ONBOARD_HUB_URL) {
            this.$router.replace({
              name: "connectToWallet"
            });
          } else {
            this.$router.replace({
              name: "scanqr",
              params: { subview: "onboarding" }
            });
          }
        }
      );

      this.fetchingName = false;
    }
  },
  methods: {
    async confirm() {
      //
      // Verify if we got previous channel information
      //
      this.fetchingName = false;

      this.$store.commit("setUserName", this.nameInput);

      try {
        let res = await this.hubConnection.getPrevChannelId(
          process.env.VUE_APP_ROLE
        );
        if (!res.success) {
          throw new Error(res.error);
        }

        if (res.channelId) {
          console.log(
            "Found Existing reconnection information, we will skip initial deposit..."
          );
          this.$router.push("channelopen");
        } else {
          console.log(
            "No reconnection information, going through initial deposit..."
          );
          this.$router.push({
            name: "deposit",
            params: {
              initialDeposit: true
            }
          });
        }
      } catch (e) {
        this.$displayError(
          "Oops!",
          "We could not connect to the payment hub to query channel information. Please try again later. " +
            "Reason: " +
            e.toString()
        );
        return;
      }
    }
  }
};
</script>
