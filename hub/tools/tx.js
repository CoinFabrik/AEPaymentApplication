/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI
---------------------------------------------------------------------------------- */
const Users =  require("aehelpers");
const jstools = require('jstools');
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
        balance = await nodeuser.balance(to_ac_publicKey);
        show_balance(to_ac_publicKey, balance, height);
    } catch (err) {
        show_balance(to_ac_publicKey, 0, height);
    }

    await my_readline("last chance to cancel. shall we continue?");

    await nodeuser.spend(amount, to_ac_publicKey);
    await jstools.sleep(5000);

    height = await nodeuser.height();
    balance = await nodeuser.balance(to_ac_publicKey);
    show_balance(to_ac_publicKey, balance, height);
}

async function get_wallet(spec, pwds) {
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
                    secretKey: await jstools.recover(pwd, obj)}
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
