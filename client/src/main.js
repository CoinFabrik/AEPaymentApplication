/* eslint-disable no-console */
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueSweetalert2 from 'vue-sweetalert2'
import Globals from './globals'

Vue.config.productionTip = false

console.log("The AE Universe One Client Application");
console.log("Process env:");
console.log(process.env)

Vue.mixin(Globals);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

Vue.use(VueSweetalert2)
