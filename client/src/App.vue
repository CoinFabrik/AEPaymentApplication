<template>
  <div id="app">
    <ChannelNotify />
    <AeMain style="padding: 20px; height: 100%;">
      <img id="ae-logo" alt="AE-logo" src="./assets/ae2x.png" />
      <div>
        <ae-text fill="primary" face="sans-l">Aternity Universe</ae-text>
      </div>
      <ae-text fill="secondary" face="sans-base">Developers Conference</ae-text>
      <div id="content">
        <transition name="slide" mode="out-in">
          <router-view></router-view>
        </transition>
      </div>
    </AeMain>
  </div>
</template>

<script>
import { AeMain, AeText } from "@aeternity/aepp-components";
import ChannelNotify from "./components/ChannelNotify"

import "@aeternity/aepp-components/dist/aepp.global.css";
import "@aeternity/aepp-components/dist/aepp.components.css";
import 'sweetalert2/dist/sweetalert2.min.css';

export default {
  name: "App",
  components: { AeMain, AeText, ChannelNotify },
  computed: {
    getAppState: function() {
      return this.$store.state.appState;
    }
  }
};
</script>

<style>
#app {
  height: 100%;
  text-align: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
#ae-logo {
  height: 10%;
}
#content {
  margin-top: 20px;
}
</style>
