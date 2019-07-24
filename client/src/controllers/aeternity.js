import { rejects } from 'assert';

/* eslint-disable no-console */

const {
  Aepp,
  Channel,
  Crypto,
  Universal
} = require('@aeternity/aepp-sdk');

const aeternity = {
  network: null,
  client: null,
  address: null,
  pk: null,
  height: null,
  api_server_proto: null,
  api_server_port: null,
  api_server_address: null,
  state_channel_api_proto: null,
  state_channel_api_host: null,
  state_channel_api_port: null
}

aeternity.connectToBaseApp = async function () {

  if (process.env.VUE_APP_MOCK_BASEAEPP_CONNECTION === "1") {
    return { status: true, error: null }
  }
  if (process.env.VUE_APP_USE_TEST_ENV === "1") {
    //
    // Forgae Testing Nodes Setup
    //

    aeternity.api_server_address = process.env.VUE_APP_TEST_API_SERVER_ADDRESS;
    aeternity.api_server_port = process.env.VUE_APP_TEST_API_SERVER_PORT;
    aeternity.api_server_proto = process.env.VUE_APP_TEST_API_SERVER_PROTO;

    aeternity.state_channel_api_proto = process.env.VUE_APP_TEST_STATE_CHANNEL_API_PROTO;
    aeternity.state_channel_api_host = process.env.VUE_APP_TEST_STATE_CHANNEL_API_HOST;
    aeternity.state_channel_api_port = process.env.VUE_APP_TEST_STATE_CHANNEL_API_PORT;
    

    const params = {
      networkId: 'ae_devnet',
      url: aeternity.getApiServerUrl(),
      internalUrl: aeternity.getApiServerUrl(),
      keypair: {
        publicKey: process.env.VUE_APP_TEST_WALLET_ADDRESS,
        secretKey: process.env.VUE_APP_TEST_WALLET_PK
      },
      compilerUrl: null
    }

    aeternity.address = process.env.VUE_APP_TEST_WALLET_ADDRESS;

    try {
      console.log("Initiating test Universal object with params:");
      console.log(params);

      aeternity.client = await Universal(params);
      return { status: true, error: null };
    } catch (err) {
      console.log(err);
      return { status: false, error: err }
    }
  } else {
    if (window.parent !== window) {
      try {
        aeternity.client = await Aepp();
        return { status: true, error: null };
      } catch (err) {
        console.log(err);
        return { status: false, error: err };
      }
    }
    else {
      return { status: false, error: "Please run this application under the Base AEpp Wallet!" };
    }
  }
}

aeternity.getAddress = function () {
  return aeternity.address;
}

aeternity.getPk = function () {
  return aeternity.client.pk;
}

aeternity.getApiServerUrl = function () {
  return aeternity.api_server_proto + '://' + aeternity.api_server_address + ':' + aeternity.api_server_port
}
aeternity.getStateChannelApiUrl = function()  {
  return aeternity.state_channel_api_proto + '://' + aeternity.state_channel_api_host + ':' + aeternity.state_channel_api_port + '/channel';
}
aeternity.getAccountBalance = async function () {
  return await aeternity.client.balance(aeternity.address);
}

aeternity.createChannel = async function (params) {
  console.log('Initializing channel with params:');
  console.log(params);

  return Channel({
      ...params,
      sign: aeternity.signFunction
    });
}

aeternity.signFunction = async function (tag, tx) {
  if (tag === 'initiator_sign') {
    return aeternity.signTransaction(tx);
  }
}

export default aeternity;