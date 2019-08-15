<template>
  <div id="app">
    <ChannelNotify />
		<AeBanner/>
		<AeMain id="main">
			<div id="content">
				<transition name="slide" mode="out-in">
					<router-view></router-view>
				</transition>
			</div>
		</AeMain>
		<LoadingScreen :isLoading="isLoading" />
	</div>
</template>

<script>
	import { AeMain } from "@aeternity/aepp-components";
	import ChannelNotify from "./components/ChannelNotify";

	import "@aeternity/aepp-components/dist/aepp.global.css";
	import "@aeternity/aepp-components/dist/aepp.components.css";
	import "sweetalert2/dist/sweetalert2.min.css";
	import LoadingScreen from "./components/LoadingScreen";
	import AeBanner from "./components/AeBanner";

	export default {
		name: "App",
		components: { AeMain, ChannelNotify, LoadingScreen, AeBanner},
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
		border-radius:20px 20px 0px 0px;
	}
	#content {
		margin-top: 15vh;
		margin-bottom: 20px;
	}
</style>