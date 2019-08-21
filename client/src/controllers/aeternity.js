
/* eslint-disable no-console */

const {
  Channel,
  Universal
} = require('@aeternity/aepp-sdk');

import Aepp from '@aeternity/aepp-sdk/es/ae/aepp';

const { TxBuilder: { calculateFee, unpackTx } } = require('@aeternity/aepp-sdk')

const aeternity = {
  network: null,
  client: null,
  address: null,
  pk: null,
  height: null,
  apiServerProtocol: null,
  apiServerPort: null,
  apiServerAddress: null,
  stateChannelApiProtocol: null,
  stateChannelApiHost: null,
  stateChannelApiPort: null,
  updateHandler: null,
  afterSignHandler: null
}

aeternity.connectToBaseApp = async function () {

  if (process.env.VUE_APP_USE_TEST_ENV === "1") {
    //
    // Forgae Testing Nodes Setup
    //
    aeternity.apiServerAddress = process.env.VUE_APP_TEST_API_SERVER_ADDRESS;
    aeternity.apiServerPort = process.env.VUE_APP_TEST_API_SERVER_PORT;
    aeternity.apiServerProtocol = process.env.VUE_APP_TEST_API_SERVER_PROTO;

    aeternity.stateChannelApiProtocol = process.env.VUE_APP_TEST_STATE_CHANNEL_API_PROTO;
    aeternity.stateChannelApiHost = process.env.VUE_APP_TEST_STATE_CHANNEL_API_HOST;
    aeternity.stateChannelApiPort = process.env.VUE_APP_TEST_STATE_CHANNEL_API_PORT;

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
    //
    // Connect through the Base Aepp Object 
    //
    try {
      aeternity.client = await Aepp();

      console.log("Connected to Base-Aepp Object. Chain height: " + await aeternity.client.height());
      console.log("Your address: " +  await aeternity.client.address());

      // console.log("Node Address: " + await aeternity.client.getNodeInfo());

      // TODO : getNodeInfo DOES NOT WORK. All hardcoded for testnet.

  
      // aeternity.stateChannelApiProtocol = "wss";
      // aeternity.stateChannelApiHost = "aehub.coinfabrik.com";
      // aeternity.stateChannelApiPort = "";

      return { status: true, error: null };
    } catch (err) {
      console.log(err);
      return { status: false, error: err };
    }
  }
}

aeternity.getAddress = async function () {
  return aeternity.client.address();
}

aeternity.getPk = function () {
  return aeternity.client.pk;
}

aeternity.getApiServerUrl = function () {
  return aeternity.apiServerProtocol + '://' + aeternity.apiServerAddress + ':' + aeternity.apiServerPort
}
aeternity.getStateChannelApiUrl = function () {
  return aeternity.stateChannelApiProtocol + '://' + aeternity.stateChannelApiHost + ':' + aeternity.stateChannelApiPort + '/channel';
}
aeternity.getAccountBalance = async function () {
  return await aeternity.client.balance(await aeternity.getAddress());
}

aeternity.createChannel = async function (params) {
  console.log('Initializing channel with params:');
  console.log(params);

  return Channel({
    ...params,
    sign: aeternity.signFunction
  });
}

aeternity.signFunction = async function (tag, tx, { updates } = {}) {

  console.log('signFunction with tag: ' + tag);

  if (tag === 'initiator_sign') {
    return aeternity.client.signTransaction(tx);
  }
  else if (tag === 'update_ack') {
    if (aeternity.updateHandler === undefined) {
      throw new Error("update_ack received but no registered handler");
    }

    const untx = unpackTx(tx);
    if (
      untx.txType === 'channelOffChain' &&
      updates.length === 1 &&
      updates[0].op === 'OffChainTransfer'
    ) {
      let accept = await aeternity.updateHandler(updates[0]);
      if (accept) {
        const sign = await aeternity.client.signTransaction(tx);
        console.log("Update TX successfully signed");
        await aeternity.afterSignHandler();
        return sign;
      } else {
        console.warn("Update TX has been rejected by user");
      }
    } else {
      console.warn("Unexpected update_ack.  TxType: " + untx.txType + "Updates: ", updates);
    }
  }
}

aeternity.update = async function (channel, fromAddr, toAddr, amount) {
  return channel.update(
    fromAddr,
    toAddr,
    amount,
    async (tx) => aeternity.client.signTransaction(tx)
  );
}

aeternity.estimateDepositFee = function (gasAmount) {
  return calculateFee(null, 'channel_deposit', { gas: gasAmount })
}

aeternity.deposit = async function (channel, amount, onChainTxCallback) {
  console.log("Deposit: ", amount);
  return channel.deposit(amount, async (tx) => aeternity.client.signTransaction(tx),
    {
      onOnChainTx: onChainTxCallback,
      onOwnDepositLocked: () => console.log("OnOwnDepositLocked"),
      onDepositLocked: () => console.log("OnDepositLocked")
    });
}

aeternity.withdraw = async function (channel, amount, onChainTxCallback) {
  console.log("Withdraw: ", amount);
  return channel.withdraw(amount, async (tx) => aeternity.client.signTransaction(tx),
    {
      onOnChainTx: onChainTxCallback,
      onOwnWithdrawLocked: () => console.log("OnOwnWithdrawLocked"),
      onWithdrawLocked: () => console.log("OnWithdrawLocked")
    });
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

aeternity.setUpdateHandler = function (f) {
  aeternity.updateHandler = f;
}

aeternity.setAfterUpdateAckSignHandler = function (f) {
  aeternity.afterSignHandler = f;
}
export default aeternity;