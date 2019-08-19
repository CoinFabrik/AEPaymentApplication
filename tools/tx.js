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
    await sleep(5000);

    height = await nodeuser.height();
    balance = await nodeuser.balance(to_ac_publicKey);
    show_balance(to_ac_publicKey, balance, height);
}

const Users = [
    {
public_key: "ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU",
private_key: "bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca"
    }, {
public_key: "ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk",
private_key: "7c6e602a94f30e4ea7edabe4376314f69ba7eaa2f355ecedb339df847b6f0d80575f81ffb0a297b7725dc671da0b1769b1fc5cbe45385c7b5ad1fc2eaf1d609d"
    }, {
public_key: "ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP",
private_key: "7fa7934d142c8c1c944e1585ec700f671cbc71fb035dc9e54ee4fb880edfe8d974f58feba752ae0426ecbee3a31414d8e6b3335d64ec416f3e574e106c7e5412"
    }, {
public_key: "ak_FHZrEbRmanKUe9ECPXVNTLLpRP2SeQCLCT6Vnvs9JuVu78J7V",
private_key: "1509d7d0e113528528b7ce4bf72c3a027bcc98656e46ceafcfa63e56597ec0d8206ff07f99ea517b7a028da8884fb399a2e3f85792fe418966991ba09b192c91"
    }, {
public_key: "ak_RYkcTuYcyxQ6fWZsL2G3Kj3K5WCRUEXsi76bPUNkEsoHc52Wp",
private_key: "58bd39ded1e3907f0b9c1fbaa4456493519995d524d168e0b04e86400f4aa13937bcec56026494dcf9b19061559255d78deea3281ac649ca307ead34346fa621"
    }, {
public_key: "ak_2VvB4fFu7BQHaSuW5EkQ7GCaM5qiA5BsFUHjJ7dYpAaBoeFCZi",
private_key: "50458d629ae7109a98e098c51c29ec39c9aea9444526692b1924660b5e2309c7c55aeddd5ebddbd4c6970e91f56e8aaa04eb52a1224c6c783196802e136b9459"
    }, {
public_key: "ak_286tvbfP6xe4GY9sEbuN2ftx1LpavQwFVcPor9H4GxBtq5fXws",
private_key: "707881878eacacce4db463de9c7bf858b95c3144d52fafed4a41ffd666597d0393d23cf31fcd12324cd45d4784d08953e8df8283d129f357463e6795b40e88aa"
    }, {
public_key: "ak_f9bmi44rdvUGKDsTLp3vMCMLMvvqsMQVWyc3XDAYECmCXEbzy",
private_key: "9262701814da8149615d025377e2a08b5f10a6d33d1acaf2f5e703e87fe19c83569ecc7803d297fde01758f1bdc9e0c2eb666865284dff8fa39edb2267de70db"
    }, {
public_key: "ak_23p6pT7bajYMJRbnJ5BsbFUuYGX2PBoZAiiYcsrRHZ1BUY2zSF",
private_key: "e15908673cda8a171ea31333538437460d9ca1d8ba2e61c31a9a3d01a8158c398a14cd12266e480f85cc1dc3239ed5cfa99f3d6955082446bebfe961449dc48b"
    }, {
public_key: "ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv",
private_key: "6eb127925aa10d6d468630a0ca28ff5e1b8ad00db151fdcc4878362514d6ae865951b78cf5ef047cab42218e0d5a4020ad34821ca043c0f1febd27aaa87d5ed7"
    }, {
public_key: "ak_zPoY7cSHy2wBKFsdWJGXM7LnSjVt6cn1TWBDdRBUMC7Tur2NQ",
private_key: "36595b50bf097cd19423c40ee66b117ed15fc5ec03d8676796bdf32bc8fe367d82517293a0f82362eb4f93d0de77af5724fba64cbcf55542328bc173dbe13d33"
    },
];


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
        from_ac = await jstools.get_account(_from, "1234");
    }

    console.log(" - opening:", process.argv[3]);
    if (process.argv[3].startsWith("ak_")) {
        to_ac =  process.argv[3];
    } else {
        to_ac =  await jstools.get_account(process.argv[3], "1234");
        to_ac = to_ac.publicKey;
    }

    console.log(" - amount:", process.argv[4]);
    let amount =  process.argv[4]
    console.log(" - transfer:");
    await transfer(from_ac, to_ac, amount);
})();
