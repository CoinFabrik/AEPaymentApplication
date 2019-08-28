/* eslint-disable no-console */
import Vue from 'vue'
import Vuex from 'vuex'
import HubConnection from './controllers/hub'
import createPersistedState from 'vuex-persistedstate'
import aeternity from './controllers/aeternity';
Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [createPersistedState({ paths: ["channelOptions", "channel", "hubUrl", "hubAddress", "hubNode", "userName", "onboardingDone", "route.*"] })],
  state: {
    balance: 0,
    aeClient: null,
    onboardingDone: false,
    channelOptions: null,
    channel: null,
    channelReconnectInfo: { offChainTx: null, channelId: null },
    initiatorBalance: null,
    responderBalance: null,
    initiatorAmount: null,
    hubBalance: null,
    hubUrl: null,
    hubAddress: null,
    hubNode: null,
    userName: null
  },
  getters: {
    initiatorAddress(state) {
      return state.channelOptions.initiatorId;
    },
    responderAddress(state) {
      return state.channelOptions.responderId;
    }
  },
  mutations: {
    setAeClient(state, aeClient) {
      state.aeClient = aeClient;
    },
    updateBalance(state, balance) {
      state.balance = balance;
    },
    loadChannelOptions(state, params) {
      state.channelOptions = params;
    },
    
    loadHubIpAddr(state, url) {
      state.hubUrl = url;
    },
    loadHubAddress(state, addr) {
      state.hubAddress = addr;
    },
    loadHubNode(state, node) {
      state.hubNode = node;
    },
    setInitialDeposit(state, amount) {
        state.initiatorAmount = amount;
    },
    setUserName(state, name) {
      state.userName = name;
    },
    setChannel(state, channel) {
      state.channel = channel;
    },
    setChannelReconnectInfo(state, offChainTx, channelId) {
      state.channelReconnectInfo.offChainTx = offChainTx;
      state.channelReconnectInfo.channelId = channelId;
    },
    updateInitiatorBalance(state, amount) {
      state.initiatorBalance = amount;
    },
    updateResponderBalance(state, amount) {
      state.responderBalance = amount;
    },
    updateInHubBalance(state, amount) {
      state.hubBalance = amount;
    },
    setOnboardingDone(state, f) {
      state.onboardingDone = f;
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
      commit('setChannelReconnectInfo', null, null);
      commit('setOnboardingDone', false);
    },
    updateOnchainBalance({ commit, state }) {
			return aeternity.getAccountBalance()
							.then(
								function (balance) {
          				commit('updateBalance', balance);
        				}
							)
							.catch(
								function (err) {
									console.error(err);
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
    async createChannel({ commit, state }) {
      return new Promise((resolve, reject) => {
        aeternity.createChannel(state.channelOptions).then(
          function (channel) {
            commit('setChannel', channel);
            // Broadcast channel messages

            channel.on(
              "statusChanged", (status) => {
                console.warn("Global-status-changed-handler: ", status);
                window.eventBus.$emit('channel-status-changed', status);
              }
            );

            channel.on(
              "message", (message) => {
                console.warn("Global-message-handler: ", message);
                const infoObj = JSON.parse(message.info);
                // emit event based in msg type:  
                // heartbeat
                // payment-request-accepted
                // payment-request-rejected
                // payment-request-completed
                // payment-request-canceled
                //
                // accepted/rejected are treated as payment-request-ack
                // completed/canceled are treated as payment-complete-ack
                let eventname, eventdata, info;
                if (infoObj.type === "payment-request-accepted") {
                  eventname = "payment-request-ack"
                  eventdata = "accepted"
                } else if (infoObj.type === "payment-request-rejected") {
                  eventname = "payment-request-ack"
                  eventdata = "rejected"
                  info = infoObj.msg;
                } else if (infoObj.type === "payment-request-canceled") {
                  eventname = "payment-complete-ack";
                  eventdata = "canceled"
                } else if (infoObj.type === "payment-request-completed") {
                  eventname = "payment-complete-ack";
                  eventdata = "completed"
                } else {
                  eventname = infoObj.type
                }

                window.eventBus.$emit(eventname, { eventdata, info });
              }
            );
            resolve(channel);
          }
        ).catch(err => reject(err));
      });
    },
    async reconnectChannel({ commit, state }) {
      state.channelOptions.offChainTx = state.channel.id;
      state.channelOptions.existingChannelId = state.channelReconnectInfo.channelId;
      aeternity.createChannel(state.channelOptions).then(
        function (channel) {
          commit('setChannel', channel);
        }
      )
    },
    triggerUpdate({ dispatch, state, getters }, amount) {
      console.log('ACTION: triggerUpdate');
      aeternity.update(state.channel, getters.initiatorAddress, getters.responderAddress, amount).then(
        function ({ accepted, signedTx }) {
          if (accepted) {
            console.log("Accepted update. tx=" + signedTx);
            dispatch('updateChannelBalances');
          } else {
            return Promise.reject(new Error("channel.updated rejected"));
          }
        }
      );
    },
    async storeChannelOptions({ commit, state }, options) {
      let params = options;
      params.sign = state.aeClient.signFunction;
      params.initiatorId = await state.aeClient.address();

      console.log("Storing up Channel Parameters:" + JSON.stringify(params));
      commit("loadChannelOptions", options);
      
    }
  }
})
