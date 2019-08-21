<template>
  <div class="connectToWallet">
    <b-container>
      <b-col>
        <div v-if="isAtInitialState">
          <AeText
            weight="bold"
            face="sans-s"
          >
            We need access to your wallet. Please click the button below to authorize this application
          </AeText>
          <br>
          <AeButton
            face="round"
            fill="primary"
            @click="$bvModal.show('authorize-modal')"
          >
            Connect your wallet
          </AeButton>
        </div>
        <div v-if="isConnecting">
          <AeText>Please wait...</AeText>
          <AeLoader />
        </div>
      </b-col>

      <b-modal
        id="authorize-modal"
        centered
        hide-footer
        hide-header
      >
        <div class="d-block text-center">
          <AeText weight="bold">
            Authorize access of this application to your account?
          </AeText>
        <br>
        <b-row>
          <b-col>
            <AeButton
              face="round"
              fill="neutral"
              @click="$bvModal.hide('authorize-modal')"
            >
              Deny
            </AeButton>
          </b-col>
          <b-col>
            <AeButton
              face="round"
              fill="primary"
              @click="connectToBaseApp(); $bvModal.hide('authorize-modal')"
            >
              Allow
            </AeButton>
          </b-col>
        </b-row>
				</div>
      </b-modal>
    </b-container>
  </div>
</template>

<script>
/* eslint-disable no-console */
import aeternity from "../controllers/aeternity.js";
import { AeText, AeButton, AeLoader } from "@aeternity/aepp-components";

const STATUS_OFFLINE = 0,
  STATUS_INIT = 0,
  STATUS_CONNECTING = 1,
  STATUS_CONNECTED = 2;

export default {
  name: "ConnectToWallet",
  components: {
    AeButton,
    AeLoader,
    AeText
  },
  data() {
    return {
      status: STATUS_OFFLINE,
      error: null
    };
  },
  computed: {
    isOffline() {
      return this.status == STATUS_OFFLINE;
    },
    isAtInitialState() {
      return this.status == STATUS_INIT;
    },
    isConnecting() {
      return this.status == STATUS_CONNECTING;
    },
    isConnected() {
      return this.status == STATUS_CONNECTED;
    }
  },
  mounted() {
    // Clear any state
    this.$store.dispatch("resetState").then(() => {
      // Preflight checks
      if (process.env.VUE_APP_ROLE === "merchant") {
        console.warn("Booting application with role:  MERCHANT");
      } else if (process.env.VUE_APP_ROLE === "client") {
        console.warn("Booting application with role:  CLIENT");
      } else {
        console.error("Cannot find application role in VUE_APP_ROLE variable");
        this.$displayError(
          "Unexpected error",
          "Application cannot start. Set proper application role to either MERCHANT or CLIENT"
        );
      }
    });
  },
  methods: {
    async connectToBaseApp() {
      this.status = STATUS_CONNECTING;
      try {
        const connectStatus = await aeternity.connectToBaseApp();
        if (connectStatus.status) {
          console.log("Aepp connect status Success");
          this.$store.commit("setAeObject", aeternity);
          this.status = STATUS_CONNECTED;
          this.$router.replace({
            name: "scanqr",
            params: { subview: "onboarding" }
          });
        } else {
          this.$displayError(
            "Oops! We could not connect to your wallet",
            connectStatus.error.toString()
          );
          this.status = STATUS_INIT;
        }
      } catch (e) {
        this.$displayError(
          "Oops! We could not connect to your wallet",
          e.toString()
        );
        this.status = STATUS_INIT;
      }
    }
  }
};
</script>