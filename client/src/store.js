/* eslint-disable no-console */
import Vue from 'vue'
import Vuex from 'vuex'
import HubConnection from './controllers/hub'
// import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
  // plugins: [createPersistedState()],
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
    userName: null
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
    loadHubIpAddr(state, url) {
      state.hubUrl = url;
    },
    loadHubAddress(state, addr) {
      state.hubAddress = addr;
    },
    setInitialDeposit(state, amount) {
      if (state.channelParams !== null) {
        state.channelParams.initiatorAmount = amount;
      }
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
    updateInHubBalance(state, amount) {
      state.hubBalance = amount;
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
      commit('updateInHubBalance', null);
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
    triggerUpdate({ dispatch, state, getters }, amount) {
      console.log('ACTION: triggerUpdate');
      state.aeternity.update(state.channel, getters.initiatorAddress, getters.responderAddress, amount).then(
        function (accepted) {
          if (accepted) {
            dispatch('updateChannelBalances');
          } else {
            return Promise.reject(new Error("channel.updated rejected"));
          }
        }
      );
    },
    async storeNetChannelParameters({ commit, state }, hubIpAddr) {
      let params = {
        initiatorId:
          process.env.VUE_APP_TEST_ENV !== "0"
            ? await state.aeternity.getAddress()
            : process.env.VUE_APP_TEST_WALLET_ADDRESS,
        responderId: null, // known after connection with Hub
        pushAmount: process.env.VUE_APP_CHANNEL_PUSH_AMOUNT,
        initiatorAmount: 0,
        responderAmount: process.env.VUE_APP_CHANNEL_RESPONDER_AMOUNT,
        channelReserve: process.env.VUE_APP_CHANNEL_RESERVE,
        ttl: process.env.VUE_APP_CHANNEL_TTL,
        lockPeriod: process.env.VUE_APP_CHANNEL_LOCK_PERIOD,
        host: process.env.VUE_APP_RESPONDER_HOST,
        port: process.env.VUE_APP_RESPONDER_PORT,
        role: "initiator",
        url: state.aeternity.getStateChannelApiUrl(),
        sign: state.aeternity.signFunction
      };

      console.log("Storing up Channel Parameters:" + JSON.stringify(params) + ", Hub IP: " + hubIpAddr);
      commit("loadChannelParams", params);
      commit("loadHubIpAddr", hubIpAddr);
    }
  }
})