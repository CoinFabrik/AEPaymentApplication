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

const port = 3001;

let _URL: string = jstools.getEnv("AENODE", jstools.getEnv("NODE", 'localhost'));
if (-1===_URL.indexOf(":")) {
    _URL = _URL + ":" +port;
}
//_URL = process.env["NODE"] ? process.env["NODE"] : _URL;
console.log("Node> ", _URL);
const API_URL = "http://" + _URL;
const WS_URL = "ws://" + _URL;  // http is ok too
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

async function load() {
    let accounts=[];
    try {
        let buf = fs.readFileSync("accounts_idx.json");
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

    let nodeuser = await Universal({
        networkId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
    });

    if (try_file) {
        accounts = await load();
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
