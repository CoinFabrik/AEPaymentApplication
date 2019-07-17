<template>
  <div id="app">
    <AeMain>
      <img alt="AE-logo" src="assets/ae2x.png" />
        <div>
          <ae-text fill="primary" face="sans-l">Aternity Universe</ae-text>
        </div>
      <ae-text fill="secondary" face="sans-base">Developers Conference</ae-text>
      <router-view/>
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
  text-align: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 60px;
}
</style>
