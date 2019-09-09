/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI
---------------------------------------------------------------------------------- */
import {Users} from "./aehelpers";
import {recover, sleep} from "../src/tools";
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


async function transfer(from_ac, to_ac_publicKey, amount) {
    let opts = {
        //networkId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: from_ac,
        compilerUrl: compilerURL
    }
    console.log(opts)
    let nodeuser = await Universal(opts);
    console.log("'''''''''''''''''''")
    let height = await nodeuser.height();
    let balance = await nodeuser.balance(from_ac.publicKey);
    show_balance(from_ac.publicKey, balance, height);

    try {
        balance = await nodeuser.balance(to_ac_publicKey);
        show_balance(to_ac_publicKey, balance, height);
    } catch (err) {
        show_balance(to_ac_publicKey, 0, height);
    }

    await my_readline("last chance to cancel. shall we continue?");

    await nodeuser.spend(amount, to_ac_publicKey);
    await sleep(5000);

    height = await nodeuser.height();
    balance = await nodeuser.balance(to_ac_publicKey);
    show_balance(to_ac_publicKey, balance, height);
}

async function get_wallet(spec, pwds?: string[]) {
    let last_err;
    const spec_idx = spec.split(":");
    const idx = spec_idx[1];
    spec = spec_idx[0];
    console.log(" - opening:", spec);

    let data = fs.readFileSync(spec);
    let obj = JSON.parse(data);
    if(idx!==null) {
        return obj[idx];
    }
    if(pwds===undefined) {
        pwds = ["", "1234"];
    }

    for(let fidx=0;fidx<pwds.length; fidx++) {
        try {
            return {publicKey: obj["public_key"],
                    secretKey: await recover(pwds[fidx], obj)}
        } catch(err) {
            last_err = err;
            //continue
        }
        throw last_err;
    }
}


(async function () {
    let _from = process.argv[2];
    let from_ac;
    let to_ac;

    if (process.argv.length<5) {
        console.error("Missing required arguments: src dst amount");
        process.exit(-1);
    }
    if (_from.startsWith("init")) {
        let idx;
        if(_from==="init") {
            idx=0
        } else {
            idx = Number.parseInt(_from.slice(4));
        }
        from_ac = {publicKey: Users[idx].public_key, secretKey: Users[idx].private_key};
    } else {
        console.log("opening:", _from);
        from_ac = await get_wallet(_from);
        //from_ac = await jstools.get_account(_from, "1234");
    }

    console.log(" - opening:", process.argv[3]);
    if (process.argv[3].startsWith("ak_")) {
        to_ac =  process.argv[3];
    } else {
        to_ac = get_wallet(process.argv[3]);
        to_ac = to_ac.publicKey;
    }

    console.log(" - amount:", process.argv[4]);
    let amount =  process.argv[4];
    console.log(" - transfer:");
    await transfer(from_ac, to_ac, amount);
})();
