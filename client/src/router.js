import Vue from 'vue'
import Router from 'vue-router'
import ConnectToWallet from './views/ConnectToWallet.vue'
import ScanQR from './views/ScanQr.vue'
import Deposit from './views/Deposit.vue'
import ConfirmTx from './views/ConfirmTx.vue'
import ConfirmPayment from './views/ConfirmPayment.vue'
import CommitAndWaitTx from './views/CommitAndWaitTx.vue'
import Success from './views/Success.vue'
import MainMenu from './views/MainMenu.vue'
import History from './views/History.vue'
import ChannelOpen from './views/ChannelOpen.vue'
import RegisterUser from './views/RegisterUser.vue'
import Withdraw from './views/Withdraw.vue'
import EnterPurchase from './views/EnterPurchase.vue'
import ShowPaymentQr from './views/ShowPaymentQr.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'connectToWallet',
      component: ConnectToWallet
    },
    {
      path: '/scanqr',
      name: 'scanqr',
      component: ScanQR,
      props: true
    },
    {
      path: '/register-user',
      name: 'register-user',
      component: RegisterUser
    },
    {
      path: '/deposit',
      name: 'deposit',
      component: Deposit,
      props: true
    },
    {
      path: '/withdraw',
      name: 'withdraw',
      component: Withdraw
    },
    {
      path: '/confirmtx',
      name: 'confirm-tx',
      component: ConfirmTx,
      props: true
    },
    {
      path: '/confirm-payment',
      name: 'confirm-payment',
      component: ConfirmPayment,
      props: true
    },
    {
      path: '/show-payment-qr',
      name: 'show-payment-qr',
      component: ShowPaymentQr,
      props: true
    },
    {
      path: '/commitwaittx',
      name: 'commit-and-wait-tx',
      component: CommitAndWaitTx,
      props: true
    },
    {
      path: '/main-menu',
      name: 'main-menu',
      component: MainMenu
    },
    {
      path: '/channelopen',
      name: 'channelopen',
      component: ChannelOpen,
      props: true
    },
    {
      path: '/history',
      name: 'history',
      component: History
    },
    {
      path: '/enterpurchase',
      name: 'enterpurchase',
      component: EnterPurchase,
      props: true
    }
  ]
})
