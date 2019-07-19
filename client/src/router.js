import Vue from 'vue'
import Router from 'vue-router'
import ConnectToWallet from './views/ConnectToWallet.vue'
import Onboarding from './views/Onboarding.vue'
import Deposit from './views/Deposit.vue'
import ConfirmTx from './views/ConfirmTx.vue'


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
    },
    {
      path: '/deposit',
      name: 'deposit',
      component: Deposit,
      props: true
    },
    {
      path: '/confirmtx',
      name: 'confirm-tx',
      component: ConfirmTx,
      props: true
    }

  ]
})
