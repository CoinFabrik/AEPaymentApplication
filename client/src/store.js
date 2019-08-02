/* eslint-disable no-console */
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    balance: 0,
    aeternity: null,
    channelParams: null,
    channel: null,
    initiatorBalance: null,
    responderBalance: null,
    hubUrl: null
  },
  getters: {
    initiatorAddress(state) {
      return state.channelParams.initiatorId;
    },
    responderAddress(state) {
      return state.channelParams.responderId;
    },
    initiatorAmount(state) {
      return state.channelParams.initiatorAmount;
    }
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
    loadHubUrl(state, url) {
      state.hubUrl = url;
    },
    setInitialDeposit(state, amount) {
      state.channelParams.initiatorAmount = amount;
    },
    setChannel(state, channel) {
      state.channel = channel;
    },
    updateInitiatorBalance(state, amount) {
      state.initiatorBalance = amount;
    },
    updateResponderBalance(state, amount) {
      state.responderBalance = amount;
    }
  },
  actions: {
    updateOnchainBalance({ commit, state }) {
      return state.aeternity.getAccountBalance().then(
        function (balance) {
          commit('updateBalance', balance);
        }
      )
    },
    updateChannelBalances({ commit, state, getters }) {
      const iAddr = getters.initiatorAddress;
      const rAddr = getters.responderAddress;
      state.channel.balances([iAddr, rAddr]).then(
        function (balances) {
          commit('updateInitiatorBalance', balances[iAddr]);
          commit('updateResponderBalance', balances[rAddr]);
        },
        function (err) {
          console.error(err);
          throw err;
        }
      )
    },
    createChannel({ commit, state }) {
      state.aeternity.createChannel(state.channelParams).then(
        function (channel) {
          commit('setChannel', channel);
        }
      )
    },
    transferTokensToResponder({ dispatch, state, getters }, amount) {
      console.log('ACTION: transferTokensToResponder');
      state.aeternity.updateEx(state.channel, getters.initiatorAddress, getters.responderAddress, amount).then(
        function (accepted) {
          if (accepted) {
            return dispatch('updateChannelBalances');
          } else {
            throw new Error("Your update has been rejected");
          }
        }
      );
    }
  }
})
