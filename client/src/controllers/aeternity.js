
/* eslint-disable no-console */

const {
  Channel,
  Universal
} = require('@aeternity/aepp-sdk');

import Aepp from '@aeternity/aepp-sdk/es/ae/aepp';
const { TxBuilder: { calculateFee, unpackTx } } = require('@aeternity/aepp-sdk')

import { setTimeout } from 'timers'
import { sleep } from '../util/tools.js'

const aeternity = {
  client: null,
  address: null,
  updateHandler: null,
  afterSignHandler: null
}

aeternity.connectToBaseApp = async function () {
  if (aeternity.client != null) {
    return { status: true, error: null };
  }

  console.warn("Aeternity Client null, reconnecting...");

  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject('timeout')
    }, 20000);
  });

  try {
    const aeSdk = Aepp.compose({
      deepConfiguration: { Ae: { methods: ['readQrCode'] } },
    })({ parent: window.parent });
    aeternity.client = await Promise.race([timeout, aeSdk]);

    console.log("aeternity.client connected. Your address: " + await aeternity.client.address() + " Your network id:" + await aeternity.client.getNetworkId());
    return { status: true, error: null };
  }
  catch (err) {
    console.log(err);
    return { status: false, error: err.toString() === 'timeout' ? "The connection to node timed out. This may indicate connection problems. Please try again later" : err.toString() };
  }

}

aeternity.getAddress = async function () {
  await aeternity.connectToBaseApp();
  return aeternity.client.address();
}

aeternity.getAccountBalance = async function () {
  await aeternity.connectToBaseApp();
  return await aeternity.client.balance(await aeternity.getAddress());
}

aeternity.createChannel = async function (params) {
  //console.log('Initializing channel with params:');
  //console.log(params);

  return Channel({
    ...params,
    sign: async (tag, tx, updates) => {
      let signedTx = await aeternity.signFunction(tag, tx, updates);
      if (!signedTx) {
        throw (new Error("rejected-by-user"));
      }
      return signedTx;
    }
  });
}

aeternity.signFunction = async function (tag, tx, { updates } = {}) {
  await aeternity.connectToBaseApp();

  console.log('signFunction with tag: ' + tag);

  if (tag === 'initiator_sign') {
    return await aeternity.signTransactionEx(tx);
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

aeternity.leaveChannel = async function (channel) {
  return channel.leave();
}

aeternity.signTransactionEx = async function (tx) {
  try {
    let signedTx = await aeternity.client.signTransaction(tx);
    return signedTx;
  }
  catch (e) {
    if (e.toString() === "Rejected by user") {
      console.warn("Sign Function Rejected by user");

      return null;  // this makes upper exception handler receive Error: Method not found.
    }
  }
}

aeternity.update = async function (channel, fromAddr, toAddr, amount) {
  return channel.update(
    fromAddr,
    toAddr,
    amount,
    async (tx) => await aeternity.signTransactionEx(tx)
  );
}

aeternity.estimateDepositFee = function (gasAmount) {
  return calculateFee(null, 'channel_deposit', { gas: gasAmount })
}

aeternity.deposit = async function (channel, amount, onChainTxCallback, onOwnDepositLockedCallback) {
  if (!aeternity.client) {
    await aeternity.connectToBaseApp();
  }

  console.log("Deposit: ", amount);
  return channel.deposit(amount, async (tx) => await aeternity.signTransactionEx(tx),
    {
      onOnChainTx: onChainTxCallback,
      onOwnDepositLocked: onOwnDepositLockedCallback,
      onDepositLocked: () => console.log("OnDepositLocked")
    });
}

aeternity.withdraw = async function (channel, amount, onChainTxCallback, onOwnWithdrawLockedCallback) {
  console.log("Withdraw: ", amount);
  return channel.withdraw(amount, async (tx) => await aeternity.signTransactionEx(tx),
    {
      onOnChainTx: onChainTxCallback,
      onOwnWithdrawLocked: onOwnWithdrawLockedCallback,
      onWithdrawLocked: () => console.log("OnWithdrawLocked")
    });
}

aeternity.closeChannel = async function (channel, onChainTxCallback) {
  return channel.shutdown(async (tx) => await aeternity.signTransactionEx(tx), {
    onOnChainTx: onChainTxCallback
  });
}

aeternity.waitForChannelStatus = async function (channel, status, timeout) {
  const POLL_INTERVAL = 250;
  let passed = 0;
  while (channel.status() !== status) {
    await sleep(POLL_INTERVAL);
    passed += POLL_INTERVAL;
    if (passed > timeout) {
      throw new Error("Timeout waiting for channel " + status);
    }
  }
}

aeternity.sendMessage = async function (channel, message, address) {
  console.log("Sending channel message to " + address + ":", message);
  return channel.sendMessage(message, address);
}

aeternity.getTxConfirmations = async function (tx) {
  await aeternity.connectToBaseApp();
  const txData = await aeternity.client.tx(tx);
  const txHeight = txData.blockHeight;
  console.log("TxHeight=" + txHeight);
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

aeternity.readQrCode = async function (title) {
  await aeternity.connectToBaseApp();
  return aeternity.client.readQrCode({ title });
}
export default aeternity;