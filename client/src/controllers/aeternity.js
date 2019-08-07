
/* eslint-disable no-console */

const {
  Aepp,
  Channel,
  Universal
} = require('@aeternity/aepp-sdk');

const { TxBuilder: {  calculateFee } } = require('@aeternity/aepp-sdk')

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
aeternity.getStateChannelApiUrl = function () {
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
  console.log('signFunction with tag: ' + tag);

  if (tag === 'initiator_sign') {
    return aeternity.client.signTransaction(tx);
  }
}

aeternity.update = async function (channel, fromAddr, toAddr, amountBN) {
  return channel.update(
    fromAddr,
    toAddr,
    amountBN.toFixed(0),
    async (tx) => aeternity.client.signTransaction(tx)
  );
}

aeternity.estimateDepositFee = function (gasAmount) {
  return calculateFee(null, 'channel_deposit', { gas: gasAmount })
}

aeternity.deposit = async function (channel, amount, onChainTxCallback) {
  console.log("Deposit: ", amount);
  return channel.deposit(amount, async (tx) => aeternity.client.signTransaction(tx), { onOnChainTx: onChainTxCallback });
}

aeternity.withdraw = async function (channel, amount, onChainTxCallback) {
  return channel.withdraw(amount, async (tx) => aeternity.client.signTransaction(tx), { onOnChainTx: onChainTxCallback });
}

aeternity.closeChannel = async function (channel, onChainTxCallback, onDepositCallback) {
  return channel.shutdown(async (tx) => aeternity.client.signTransaction(tx), {
    onOnChainTx: onChainTxCallback,
    onDepositCallbackLocked: onDepositCallback
  });
}

aeternity.sendMessage = async function (channel, message, address) {
  console.log("Sending channel message to " + address + ":", message);
  return channel.sendMessage(message, address);
}

aeternity.getTxConfirmations = async function (tx) {
  const txData = await aeternity.client.tx(tx);
  const txHeight = txData.blockHeight;
  if (txHeight > 0) {
    const chainHeight = await aeternity.client.height();
    return chainHeight - txHeight;
  }

  return 0;
}


export default aeternity;