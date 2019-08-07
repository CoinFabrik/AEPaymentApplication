const {Channel, Universal, TxBuilder: {unpackTx}} = require('@aeternity/aepp-sdk')
const {BigNumber} = require('bignumber.js')

const NODEHOST = "10.10.0.79";
const API_URL = 'http://'+NODEHOST+':3001'
const INTERNAL_API_URL = 'http://'+NODEHOST+':3001'
const STATE_CHANNEL_URL = 'ws://'+NODEHOST+':3001/channel'
const NETWORK_ID = 'ae_docker'
const RESPONDER_HOST = 'localhost'
const RESPONDER_PORT = 3001

const initiatorAddress = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'
const responderAddress = 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk'

let initiatorAccount
let responderAccount

async function createAccounts() {
    initiatorAccount = await Universal({
        networkdId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: {
            publicKey: initiatorAddress,
            secretKey: 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca'
        }
    })
    console.log("account1: ", initiatorAddress, await initiatorAccount.balance(initiatorAddress))
    responderAccount = await Universal({
        networkdId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: {
            publicKey: responderAddress,
            secretKey: '7c6e602a94f30e4ea7edabe4376314f69ba7eaa2f355ecedb339df847b6f0d80575f81ffb0a297b7725dc671da0b1769b1fc5cbe45385c7b5ad1fc2eaf1d609d'
        }
    })
    console.log("account2: ", responderAddress, await responderAccount.balance(responderAddress))
}

async function initiatorSign(tag, tx) {
    console.log("isign:", tag, tx)
    if (tag === 'initiator_sign') {
        return initiatorAccount.signTransaction(tx)
    }

    // Deserialize binary transaction so we can inspect it
    const {txType, tx: txData} = unpackTx(tx)
    if (tag === 'shutdown_sign_ack') {
        // Fee amount is splitted equally per participants
        const fee = BigNumber(txData.fee).div(2)
        if (
            txType === 'channelCloseMutual' &&
            // To keep things simple we manually check that
            // balances are correct (as a result of previous transfer update)
            BigNumber(txData.initiatorAmountFinal).plus(fee).eq(BigNumber(DEPOSIT).minus(10)) &&
            BigNumber(txData.responderAmountFinal).plus(fee).eq(BigNumber(DEPOSIT).plus(10))
        ) {
            return initiatorAccount.signTransaction(tx)
        }
    }
    console.log("****  unsigned:", tag, tx)
}

async function responderSign(tag, tx, {updates} = {}) {
    console.log("rsign:", tag, tx)
    if (tag === 'responder_sign') {
        return responderAccount.signTransaction(tx)
    }

    // Deserialize binary transaction so we can inspect it
    const {txType, tx: txData} = unpackTx(tx)
    // When someone wants to transfer a tokens we will receive
    // a sign request with `update_ack` tag
    if (tag === 'update_ack') {
        // Check if update contains only one offchain transaction
        // and sender is initiator
        if (
            txType === 'channelOffChain' &&
            updates.length === 1 &&
            updates[0].op === 'OffChainTransfer' &&
            updates[0].from === initiatorAddress
        ) {
            return responderAccount.signTransaction(tx)
        }
    }

    if(tag === "withdraw_ack") {
        return responderAccount.signTransaction(tx)
    }
    console.log("****  unsigned:", tag, tx)
}

async function connectAsInitiator(params) {
    return Channel({
        ...params,
        url: STATE_CHANNEL_URL,
        role: 'initiator',
        sign: initiatorSign
    })
}

async function connectAsResponder(params) {
    return Channel({
        ...params,
        url: STATE_CHANNEL_URL,
        role: 'responder',
        sign: responderSign
    })
}

const DEPOSIT = 1000000000000000000
const params = {
    // Public key of initiator
    // (in this case `initiatorAddress` defined earlier)
    initiatorId: initiatorAddress,
    // Public key of responder
    // (in this case `responderAddress` defined earlier)
    responderId: responderAddress,
    // Initial deposit in favour of the responder by the initiator
    pushAmount: 0,
    // Amount of tokens initiator will deposit into state channel
    initiatorAmount: DEPOSIT,
    // Amount of tokens responder will deposit into state channel
    responderAmount: DEPOSIT,
    // Minimum amount both peers need to maintain
    channelReserve: 40000,
    // Minimum block height to include the channel_create_tx
    ttl: 1000,
    // Amount of blocks for disputing a solo close
    lockPeriod: 10,
    // Host of the responder's node
    host: RESPONDER_HOST,
    // Port of the responders node
    port: RESPONDER_PORT,
}

createAccounts().then(() => {
    // initiator connects to state channels endpoint
    connectAsInitiator(params).then(async initiatorChannel => {
        initiatorChannel.on('statusChanged', async (status) => {
            console.log('State channel:', status)
            if (status === 'open') {
                console.log('State channel has been opened!')
            }
        })

        initiatorChannel.on('onChainTx', (tx) => {
            console.log('channel_create_tx:', tx)
        })

        initiatorChannel.sendMessage('hello world', responderAddress)

        the_result = null;
        try{
            the_result = await initiatorChannel.update(
                // Sender account
                initiatorAddress,
                // Recipient account
                responderAddress,
                // Amount
                10,
                // This function should verify offchain transaction
                // and sign it with initiator's private key
                async (tx) => initiatorAccount.signTransaction(tx)
            );
        } catch(err) {
            console.log("UOPDATE ERR:", err);
        }

        if (the_result.accepted) {
            console.log('Succesfully transfered 10 tokens!')
        } else {
            console.log('Transfer has been rejected')
        }

        console.log("initiator balance:", await initiatorChannel.balances([initiatorAddress]));
        let b1 = (await initiatorChannel.balances([initiatorAddress]))[initiatorAddress];
        console.log("balance: ", b1)
        console.log("without expected fee: ", (new BigNumber(b1)).minus(new BigNumber(20000000000000)).toString(10))

        try{
            console.log("TESTING withdraw..")
            the_result = await initiatorChannel.withdraw(
                1, async (tx) => await initiatorAccount.signTransaction(tx), {
                    onOnChainTx: (tx) => {console.log(" 1 on chain tx..")},
                    onOwnWithdrawLocked: (tx) => {console.log(" 2 onOwnWithdrawLocked")},
                    onWithdrawLocked: (tx) => {console.log(" 3 onWithdrawLocked")}});
            console.log("the result:", the_result);
        } catch(err) {
            console.log("withdraw ERR:", err);
        }

        initiatorChannel.on('error', err => console.log(err))
    }).catch(err => {
        console.log('Initiator failed to connect')
        console.log(err)
    })

    // responder connects to state channels endpoint
    connectAsResponder(params).then(async responderChannel => {
        responderChannel.on('message', (msg) => {
            console.log('Received message from:', msg.from)
            console.log(msg.info)
        })

        // close channel after a minute
        setTimeout(() => {
            console.log('Closing channel...')
            responderChannel.shutdown(
                // This function should verify shutdown transaction
                // and sign it with responder's secret key
                async (tx) => responderAccount.signTransaction(tx)
            ).then((tx) => {
                console.log('State channel has been closed')
                console.log('You can track this transaction onchain', tx)
            }).catch(err => console.log(err))
        }, 60000)

        responderChannel.on('error', err => console.log(err))
    }).catch(err => {
        console.log('Responder failed to connect')
        console.log(err)
    })
})
