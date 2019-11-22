/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI
---------------------------------------------------------------------------------- */
import BigNumber from "bignumber.js";
//import {getEnv} from "../src/tools";

const jstools = require('./jstools');
const readline = require('readline');
const {
    Universal
} = require('@aeternity/aepp-sdk');

const fs = require('fs');


function get_opts(keypair?: object): object {
    const port = 3001;
    let theURL = 'localhost:' + port;
    theURL = process.env["NODE"] ? process.env["NODE"] : theURL;
    console.log("Node> ", theURL);

    let temp = "";
    if(-1===theURL.indexOf("://")) {
        temp = "http://";
    }
    const API_URL = temp + theURL;
    const INTERNAL_API_URL = API_URL;
    const compilerURL = 'https://compiler.aepps.com';
    return {
        //networkId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: keypair,
        compilerUrl: compilerURL
    }
}


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

async function load(filename) {
    if (filename==null) {
        filename = "accounts_idx.json";
    }
    let accounts=[];
    try {
        let buf = fs.readFileSync(filename);
        accounts = JSON.parse(buf.toString("ascii"));
    } catch (err) {
    }
    return accounts;
}


(async function () {
    let accounts=[];
    let _from = process.argv[2];
    let from_ac;
    let try_file = false;

    if (_from==="init") {
        from_ac = {
            publicKey: "ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU"
        }
    } else {
        if (_from.startsWith("ak_")) {
            from_ac =  {publicKey: _from};
        } else {
            console.log("opening:", _from);
            try {
                from_ac = await jstools.get_account(_from, "1234");
            } catch (err) {
                try_file = true;
            }
        }
    }

    let opts = get_opts();
    console.log(opts)
    let nodeuser = await Universal(opts);


    if (try_file) {
        accounts = await load(_from);
    } else {
        accounts = [from_ac];
    }

    for (let from_ac of accounts) {
        let balance;
        try {
            balance = new BigNumber(await nodeuser.balance(from_ac.publicKey));
        } catch(err) {
            balance = "no balance."
        }
        console.log("balance("+from_ac.publicKey+")=", balance.toString(10))
    }

})();
