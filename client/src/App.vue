<template>
  <div id="app">
    <AeBanner />
    <AeMain id="main">
      <b-container class="container">
        <div id="content" class="container">
          <transition name="slide" mode="out-in">
            <router-view />
          </transition>
        </div>
      </b-container>
    </AeMain>
    <LoadingScreen :is-loading="isLoading" />
  </div>
</template>

<script>
import { AeMain } from "@aeternity/aepp-components";

import "@aeternity/aepp-components/dist/aepp.global.css";
import "@aeternity/aepp-components/dist/aepp.components.css";
import "sweetalert2/dist/sweetalert2.min.css";
import "./assets/css/global.css";
import LoadingScreen from "./components/LoadingScreen";
import AeBanner from "./components/AeBanner";

export default {
  name: "App",
  components: { AeMain, LoadingScreen, AeBanner },
  data() {
    return { isLoading: false };
  },
  async beforeMount() {
    // restore channel if available.

    //console.log(this.$store.state.channel);

    if (!this.$isOnDemandMode) {
      if (this.$store.state.channelOpenDone) {
        try {
          console.log("beforeMount(): Channel already opened, reconnecting");
          await this.$store.dispatch("createChannel");
        } catch (err) {
          console.error(
            "Cannot re-connect your channel. Reason: " + e.toString()
          );
        }
      }
    }

    // restore route if available.
    this.$store.state.route &&
      this.$router.replace({
        name: this.$store.state.route.name,
        params: this.$store.state.route.params
      });
  }
};
</script>
