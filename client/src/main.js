/* eslint-disable no-console */
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

console.log("The AE Universe One Client Application");
console.log("Process env:");
console.log(process.env)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
