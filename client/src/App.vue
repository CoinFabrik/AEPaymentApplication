<template>
  <div id="app">
    <AeBanner />
    <AeMain id="main">
      <b-container>
        <div id="content">
          <transition
            name="slide"
            mode="out-in"
          >
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
	import LoadingScreen from "./components/LoadingScreen";
	import AeBanner from "./components/AeBanner";

	export default {
		name: "App",
		components: { AeMain, LoadingScreen, AeBanner },
		data() {
			return { isLoading: false };
		},
	};
</script>

<style>
	#app {
		overflow: hidden;
		height: 100vh;
		text-align: center;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		background-color: #311B58;
	}
	#main {
		height: 100vh;
		min-height: 0vh;
		width: 100vw;
		border-radius:30px 30px 0px 0px;
	}
	#content {
		margin-top: 10vh;
		margin-bottom: 10vh;
		margin-left: 2vh;
		margin-right: 2vh;
	}
	html, body {
		overflow: hidden;
	}
</style>