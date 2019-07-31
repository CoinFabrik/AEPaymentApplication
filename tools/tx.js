/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI
---------------------------------------------------------------------------------- */
const jstools = require('./jstools');
const readline = require('readline');
const {
    Universal
} = require('@aeternity/aepp-sdk');

const fs = require('fs');

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


async function sleep(ms, debug) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(resolve, ms)
        } catch (err) {
            reject(err)
        }
    });
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


function show_balance(address, balance, height) {
    console.log(address, " balance at ", height, " is: ", balance);
}


async function transfer(from_ac, to_ac, amount) {
    let nodeuser = await Universal({
        networkId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: from_ac,
        compilerUrl: compilerURL
    });

    let height = await nodeuser.height();
    let balance = await nodeuser.balance(from_ac.publicKey);
    show_balance(from_ac.publicKey, balance, height);

    try {
        balance = await nodeuser.balance(to_ac.publicKey);
        show_balance(to_ac.publicKey, balance, height);
    } catch (err) {
        show_balance(to_ac.publicKey, 0, height);
    }

    await my_readline("last chance to cancel. shall we continue?");

    await nodeuser.spend(amount, to_ac.publicKey);
    await sleep(5000);

    height = await nodeuser.height();
    balance = await nodeuser.balance(to_ac.publicKey);
    show_balance(to_ac.publicKey, balance, height);
}



(async function () {
    let _from = process.argv[2];
    let from_ac;

    if (_from==="init") {
        from_ac = {
            publicKey: "ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU",
            secretKey: "bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca"
        }
    } else {
        console.log("opening:", _from);
        from_ac = await jstools.get_account(_from, "1234");
    }

    console.log(" - opening:", process.argv[3]);
    let to_ac =  await jstools.get_account(process.argv[3], "1234");
    console.log(" - amount:", process.argv[4]);
    let amount =  process.argv[4]
    console.log(" - transfer:");
    await transfer(from_ac, to_ac, amount);
})();
