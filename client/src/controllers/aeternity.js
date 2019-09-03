
/* eslint-disable no-console */

const {
  Channel,
  Universal
} = require('@aeternity/aepp-sdk');

import Aepp from '@aeternity/aepp-sdk/es/ae/aepp';
const { TxBuilder: { calculateFee, unpackTx } } = require('@aeternity/aepp-sdk')

import { setTimeout } from 'timers'

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
    }, 6000);
  });

  try {
    let ret = await Promise.race([timeout, Aepp()]);
    aeternity.client = ret;
    console.log("aeternity.client connected. Your address: " + await aeternity.client.address());
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
  console.log('Initializing channel with params:');
  console.log(params);

  return Channel({
    ...params,
    sign: aeternity.signFunction
  });
}

aeternity.signFunction = async function (tag, tx, { updates } = {}) {
  await aeternity.connectToBaseApp();

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
    async (tx) => {
      try {
        let signedTx = await aeternity.client.signTransaction(tx);
        return signedTx;
      }
      catch (e) {
        if (e.toString() === "Rejected by user") {
          console.warn("Sign Function Rejected by user");

          channel.sendMessage({ type: "payment-user-cancel" }, toAddr);
          return null;  // this makes upper exception handler receive Error: Method not found.
        }
      }
    }
  );

      // catch (e) {
      //   // Was rejected by user ?
      //   if (e.toString() === "Rejected by user") {
      //     //
      //     // There is no way at this time (sep 2019) to reject
      //     // an update "cleanly".  So we will send another one, forcing  
      //     // an update conflict, and discarding this round.
      //     //

      //     console.warn("Updated rejected by user, sending manual conflicting update to discard");
      //     aeternity.update(channel, fromAddr, toAddr, amount).then(({ accepted, signedTx }) => {
      //       if (accepted) {
      //         console.error("Forced Update-conflict expected to fail, but was accepted anyway!");
      //       } else {
      //         console.warn("Forced Update-conflict successfully rejected.");
      //       }
      //     }).catch(err => {
      //       console.error("Forced Update-conflict error: " + err.toString());
      //     })
      //   }
      // }
   // }
  //);
}

aeternity.estimateDepositFee = function (gasAmount) {
  return calculateFee(null, 'channel_deposit', { gas: gasAmount })
}

aeternity.deposit = async function (channel, amount, onChainTxCallback) {
  if (!aeternity.client) {
    await aeternity.connectToBaseApp();
  }

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

aeternity.closeChannel = async function (channel, onChainTxCallback) {
  return channel.shutdown(async (tx) => aeternity.client.signTransaction(tx), {
    onOnChainTx: onChainTxCallback
  });
}

aeternity.sendMessage = async function (channel, message, address) {
  console.log("Sending channel message to " + address + ":", message);
  return channel.sendMessage(message, address);
}

aeternity.getTxConfirmations = async function (tx) {
  await aeternity.connectToBaseApp();
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