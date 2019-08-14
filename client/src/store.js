/* eslint-disable no-console */
import Vue from 'vue'
import Vuex from 'vuex'
import HubConnection from './controllers/hub'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    balance: 0,
    aeternity: null,
    channelParams: null,
    channel: null,
    initiatorBalance: null,
    responderBalance: null,
    hubBalance: null,
    hubUrl: null,
    hubAddress: null,
    userName: null,
    buyRequestInfo: null
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
    setResponderId(state, addr) {
      state.channelParams.responderId = addr;
    },
    loadHubUrl(state, url) {
      state.hubUrl = url;
    },
    loadHubAddress(state, addr) {
      state.hubAddress = addr;
    },
    setInitialDeposit(state, amount) {
      state.channelParams.initiatorAmount = amount;
    },
    setUserName(state, name) {
      state.userName = name;
    },
    setChannel(state, channel) {
      state.channel = channel;
    },
    updateInitiatorBalance(state, amount) {
      state.initiatorBalance = amount;
    },
    updateResponderBalance(state, amount) {
      state.responderBalance = amount;
    },
    updateInHubBalance(state,amount){
      state.hubBalance = amount;
    },
    storeLastBuyRequestInfo(state, data) {
      state.buyRequestInfo = data;
    },
    clearLastBuyRequestInfo(state) {
      state.buyRequestInfo = null;
    }
  },
  actions: {
    resetState({ commit }) {
      commit('setInitialDeposit', null);
      commit('setUserName', null);
      commit('setChannel', null);
      commit('updateBalance', 0);
      commit('updateInitiatorBalance', null);
      commit('updateResponderBalance', null);
      commit('clearLastBuyRequestInfo');
    },
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
          return Promise.reject(err);
        }
      )
    },
    async updateHubBalance({ commit, state, getters }) {
      let hubConnection = new HubConnection(state.hubUrl, getters.initiatorAddress);
      let res = await hubConnection.getHubBalance();
      if (!res.success) {
        return Promise.reject(new Error(res.error));
      }
      commit('updateInHubBalance', res.balance);
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
            return Promise.reject(new Error("channel.updated rejected"));
          }
        }
      );
    }
  }
})
