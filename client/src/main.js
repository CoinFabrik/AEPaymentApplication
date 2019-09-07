/* eslint-disable no-console */
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueSweetalert2 from 'vue-sweetalert2'
import Globals from './globals'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import { LayoutPlugin, ModalPlugin, ButtonPlugin } from 'bootstrap-vue'
import { sync } from 'vuex-router-sync'
import AeBanner from "./components/AeBanner";
import ViewTitle from "./components/ViewTitle";
import ViewDescription from "./components/ViewDescription";
import ViewButtonSection from "./components/ViewButtonSection";
import LoadingModal from "./components/LoadingModal";
import ViewBalances from "./components/ViewBalances";
import ViewTransaction from "./components/ViewTransaction";
import CloseModal from "./components/CloseModal.vue";
import { AeButton, AeDivider, AeText, AeAmount,
	AeAmountInput, AePanel, AeLoader,
	AeList, AeListItem, AeInput, AeQRCode, AeIcon
 } from "@aeternity/aepp-components";

window.eventBus = new Vue();

Vue.component('CloseModal', CloseModal)
Vue.component('AeBanner', AeBanner)
Vue.component('AeQRCode', AeQRCode)
Vue.component('AeIcon', AeIcon)
Vue.component('AePanel', AePanel)
Vue.component('AeAmountInput', AeAmountInput)
Vue.component('AeListItem', AeListItem)
Vue.component('AeList', AeList)
Vue.component('AeInput', AeInput)
Vue.component('AeButton', AeButton)
Vue.component('AeLoader', AeLoader)
Vue.component('AeDivider', AeDivider)
Vue.component('AeAmount', AeAmount)
Vue.component('AeText', AeText)
Vue.component('ViewTitle', ViewTitle)
Vue.component('ViewDescription', ViewDescription)
Vue.component('ViewTransaction', ViewTransaction)
Vue.component('ViewBalances', ViewBalances)
Vue.component('ViewButtonSection', ViewButtonSection)
Vue.component('LoadingModal', LoadingModal)

Vue.use(ButtonPlugin)
Vue.use(LayoutPlugin)
Vue.use(ModalPlugin)
Vue.config.productionTip = false

console.log("==== The AE Universe One Client Application  Version " + process.env.VUE_APP_VERSION +
  " (" + process.env.VUE_APP_RELEASE_DATE + ") ====");
console.log("Process env:");
console.log(process.env)

Vue.mixin(Globals);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

Vue.use(VueSweetalert2)

sync(store, router)

window.addEventListener('beforeunload', (e) => {
  console.log("x");
  e.preventDefault();
  e.preventDefault();
  e.returnValue = '';
  return '';
  
})