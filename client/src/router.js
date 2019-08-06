import Vue from 'vue'
import Router from 'vue-router'
import ConnectToWallet from './views/ConnectToWallet.vue'
import ScanQR from './views/ScanQr.vue'
import Deposit from './views/Deposit.vue'
import ConfirmTx from './views/ConfirmTx.vue'
import CommitAndWaitTx from './views/CommitAndWaitTx.vue'
import Success from './views/Success.vue'
import ErrorView from './views/ErrorView.vue'
import MainMenu from './views/MainMenu.vue'
import History from './views/History.vue'
import ChannelOpen from './views/ChannelOpen.vue'
import ChannelClose from './views/ChannelClose.vue'
import RegisterMerchant from './views/RegisterMerchant.vue'
import Withdraw from './views/Withdraw.vue'
import ShutdownDone from './views/ShutdownDone.vue'

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
      path: '/register-merchant',
      name: 'register-merchant',
      component: RegisterMerchant
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
      path: '/commitwaittx',
      name: 'commit-and-wait-tx',
      component: CommitAndWaitTx,
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
    },
    {
      path: '/shutdowndone',
      name: 'shutdowndone',
      component: ShutdownDone
    },
    {
      path: '/error',
      name: 'error',
      component: ErrorView,
      props: true
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
      path: '/channelclose',
      name: 'channelclose',
      component: ChannelClose
    }
  ]
})
