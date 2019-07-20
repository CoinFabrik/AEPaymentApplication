import Vue from 'vue'
import Router from 'vue-router'
import ConnectToWallet from './views/ConnectToWallet.vue'
import Onboarding from './views/Onboarding.vue'
import Deposit from './views/Deposit.vue'
import ConfirmTx from './views/ConfirmTx.vue'
import WaitTx from './views/WaitTx.vue'
import Success from './views/Success.vue'
import MainMenu from './views/MainMenu.vue'

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
    },
    {
      path: '/waittx',
      name: 'wait-tx',
      component: WaitTx,
      props: true
    },
    {
      path: '/mainmenu',
      name: 'mainmenu',
      component: MainMenu
    },
    {
      path: '/success',
      name: 'success',
      component: Success,
      props: true
    }
  ]
})
