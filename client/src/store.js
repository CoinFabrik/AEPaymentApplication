/* eslint-disable no-console */
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    balance: 0,
    aeternity: null,
    channelParams: null,
    channel: null
  },
  getters: {
  },
  mutations: {
    setAeObject(state, aeternityObject) {
      state.aeternity = aeternityObject;
    },
    updateBalance(state, balance) {
      state.balance = balance;
    },
    loadChannelParams(state, params) {
      state.channelParams = params;
    },
    setInitialDeposit(state, amount) {
      state.channelParams.initiatorAmount = amount;
    },
    setChannel(state, channel) {
      state.channel = channel;
    },
  },
  actions: {
    getCurrentBalance({ commit, state }) {
      return state.aeternity.getAccountBalance().then(
        function (balance) {
          commit('updateBalance', balance);
        }
      )
    },
    createChannel({ commit, state }) {
      state.aeternity.createChannel(state.channelParams).then(
        function (channel) {
          commit('setChannel', channel);
        }
      ).catch(err => { console.error("CATCHED");throw err; } )
    }
  }
})
