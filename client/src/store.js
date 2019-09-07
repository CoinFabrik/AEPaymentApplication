/* eslint-disable no-console */
import Vue from 'vue'
import Vuex from 'vuex'
import HubConnection from './controllers/hub'
import createPersistedState from 'vuex-persistedstate'
import aeternity from './controllers/aeternity';
Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [createPersistedState({
    paths: ["channel",
      "channelOptions",
      "lastOpenChannelId",
      "lastOpenChannelState",
      "hubUrl",
      "hubAddress",
      "hubNode",
      "userName",
      "channelOpenDone",
      "onboardingDone",
      "onboardingQrScan",
      "route"]
  })],
  state: {
    balance: 0,
    channel: null,
    lastOpenChannelId: null,
    lastOpenChannelState: null,
    onboardingQrScan: null,
    channelOpenDone: null,
    channelOptions: null,
    initiatorBalance: null,
    responderBalance: null,
    initiatorAmount: 0,
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
    updateInitiatorBalance(state, amount) {
      state.initiatorBalance = amount;
    },
    updateResponderBalance(state, amount) {
      state.responderBalance = amount;
    },
    updateInHubBalance(state, amount) {
      state.hubBalance = amount;
    },
    setChannelOpenDone(state, f) {
      state.channelOpenDone = f;
    },
    setOnboardingQrScan(state, f) {
      state.onboardingQrScan = f;
    },
    setLastOpenChannelId(state, id) {
      state.lastOpenChannelId = id;
    },
    setLastOpenChannelState(state, chstate) {
      state.lastOpenChannelState = chstate;
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
      commit('setChannelOpenDone', null);
      commit('setOnboardingQrScan', null);
      commit('setLastOpenChannelId', null);
      commit('setLastOpenChannelState', null);
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
    async updateChannelBalances({ dispatch, commit, state, getters }) {
      // if (state.channel.balances === undefined) {
      //   console.log("state.channel NULL, re-creating channel ...");
      //   state.channelOptions.existingChannelId = state.lastOpenChannelId;
      //   state.channelOptions.offchainTx = state.lastOpenChannelState.signedTx;
      //   //state.channelOptions.initiatorAmount = 0;
      //   await dispatch('createChannel');
      //   console.log("Created new channel");
      // }
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
    async openChannel({ dispatch, commit, state }) {
      console.log("action: openChannel");
      let hub = new HubConnection(state.hubUrl, await aeternity.getAddress()
      );

      let res = await hub.notifyUserOnboarding(
        state.initiatorAmount,
        state.userName,
        process.env.VUE_APP_ROLE
      );

      commit("loadHubAddress", res.address);
      await dispatch("storeChannelOptions", res.options);
      await dispatch("createChannel");
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
                if (status === "open") {
                  // Save identification information
                  commit('setLastOpenChannelId', channel.id());
                  channel.state().then(s =>
                    commit('setLastOpenChannelState', s));
                }
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
                if (infoObj.type === "heartbeat") {
                  state.channel.sendMessage('heartbeat_ack', state.channelOptions.responderId);
                  return;
                }
                else if (infoObj.type === "payment-request-accepted") {
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
                  info = infoObj;
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
      params.sign = aeternity.signFunction;
      params.initiatorId = await aeternity.client.address();
      //params.url = "wss://aehub.coinfabrik.com:4433/channel"

      console.log("Storing up Channel Parameters:" + JSON.stringify(params));
      commit("loadChannelOptions", options);

    },
    async getChannel({ dispatch, commit, state }) {
      if (state.store.channel === null) {
        await dispatch('createChannel');
      }
      return this.store.state.channel;
    }
  }
})
