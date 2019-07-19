<template>
  <div id="app">
    <AeMain style="padding: 20px; height: 100%;">
      <img alt="AE-logo" src="assets/ae2x.png" />
        <div>
          <ae-text fill="primary" face="sans-l">Aternity Universe</ae-text>
        </div>
      <ae-text fill="secondary" face="sans-base">Developers Conference</ae-text>
      <transition name="slide" mode="out-in">
        <router-view></router-view>
      </transition>
    </AeMain>
  </div>
</template>

<script>
import {
  AeMain,
  AeText
} from "@aeternity/aepp-components"; 

import "@aeternity/aepp-components/dist/aepp.global.css";
import "@aeternity/aepp-components/dist/aepp.components.css";

export default {
  name: "App",
  components: { AeMain, AeText }

}
</script>

<style>
#app {
  height: 100%;
  text-align: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
