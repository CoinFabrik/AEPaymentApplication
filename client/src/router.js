import Vue from 'vue'
import Router from 'vue-router'
import ConnectToWallet from './views/ConnectToWallet.vue'
import Onboarding from './views/Onboarding.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'connectToWallet',
      component: ConnectToWallet
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: Onboarding
    }
  ]
})
