/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI
---------------------------------------------------------------------------------- */
//import get_account from "./jstools";
const jstools = import "jstools";
const readline = require('readline');
const {
    Universal
} = require('@aeternity/aepp-sdk');

const fs = require('fs');
// const bs58 = require('bs58');

// const i_addr = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU';
// const r_addr = 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk';
// const i_secretKey = 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca';
// const r_secretKey = '7c6e602a94f30e4ea7edabe4376314f69ba7eaa2f355ecedb339df847b6f0d80575f81ffb0a297b7725dc671da0b1769b1fc5cbe45385c7b5ad1fc2eaf1d609d';

const port = 3001;

let URL = 'localhost:' + port;
URL = process.env["NODE"] ? process.env["NODE"] : URL;
console.log("Node> ", URL);
const API_URL = "http://" + URL;
const WS_URL = "ws://" + URL;  // http is ok too
const INTERNAL_API_URL = API_URL;
let STATUS = "";
const compilerURL = 'https://compiler.aepps.com';
const NETWORK_ID = 'ae_devnet';


const HUBADDR = "localhost"
const HUBPORT = 3000;

var util = require('util')


async function sleep(ms, debug) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(resolve, ms)
        } catch (err) {
            reject(err)
        }
    });
}

async function wait_state(expected) {
    return await wait_for(() => STATUS === expected);
}

async function wait_for(func) {
    while (!func()) {
        await sleep(100);
    }
}

async function hb(peer) {
    while (1) {
        await peer.sendMessage("beep beep");
        await sleep(46 * 1000, true);
    }
}


async function my_readline(msg) {
    return new Promise((resolve, reject)=> {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question(msg, (answer) => {
          rl.close();
          resolve(answer);
        });
    });

}




async function transfer(from_ac, to_ac, amount) {
    const d_addr = "ak_dfLvALARoMJs4kvKDkvjdf6Crvs9pAqJYEv3WsxMHM9hNw4DK";
    const i_addr = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU';
    const i_secretKey = 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca';

    let nodeuser = await Universal({
        networkId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: from_ac,
        compilerUrl: compilerURL
    });

    let height = await nodeuser.height();
    let balance = await nodeuser.balance(from_ac.publicKey);
    console.log(from_ac.publicKey," balance at ", height, " is: ", balance);

    try {
        balance = await nodeuser.balance(to_ac.publicKey);
        console.log(to_ac.publicKey, " balance at ", height, " is: ", balance);
    } catch (err) {
        console.log(to_ac.publicKey, " balance at ", height, " seems to be: 0");
    }

    await my_readline("continue?");

    //if (balance === 0) {
        await nodeuser.spend("50000000000000000", d_addr);
        await sleep(5000);

        height = await nodeuser.height();
        balance = await nodeuser.balance(d_addr);
        console.log(" d_addr: ", d_addr, height, " balance: ", balance);
    //}
}



(async function () {
    let _from = process.argv[1];
    let from_ac;

    if (_from==="init") {
        from_ac = {
            publicKey: "ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU",
            secretKey: "bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca"
        }
    } else {
        from_ac = jstools.get_account();
    }

    let to_ac = jstools.get_account(process.argv[2]);
    let amount = jstools.get_account(process.argv[3]);
    await transfer(from_ac, to_ac, amount);
})();
