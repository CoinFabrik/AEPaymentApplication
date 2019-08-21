import {API_URL, INTERNAL_API_URL} from "../src/config";

const bs58check = require('bs58check');
import * as fs from "fs";
import BigNumber from "bignumber.js";
const {
    Crypto,
} = require('@aeternity/aepp-sdk');


//import * as Crypto from '@aeternity/aepp-sdk/es/utils/keystore'
//const {keystore} = require('@aeternity/aepp-sdk/es/utils/keystore');


async function save(an_array) {
    console.log(JSON.stringify(an_array));
    fs.writeFileSync("accounts_idx.json", JSON.stringify(an_array));
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

async function generateSecureWallet(name) {  //}, { output = '', password, overwrite }) {
  //password = password || await prompt(PROMPT_TYPE.askPassword)
  const { secretKey, publicKey } = Crypto.generateKeyPair(true)
    //console.log(await Crypto.dump(name, password, secretKey));
  return { secretKey: hexdump(secretKey), publicKey: buf2addr(publicKey) };
}


function buf2addr(obj: any) {
    const publicKeyBuffer = Buffer.from(obj,'hex')
    let xx = Buffer.from(publicKeyBuffer)
    const pubKeyAddress = bs58check.encode(xx)
    return `ak_${pubKeyAddress}`;
}

function pad(n: string, width: number, z = '0') {
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function hexdump(obj: any) {
    const publicKeyBuffer = Buffer.from(obj,'hex')
    let xx = Buffer.from(publicKeyBuffer)
    let view = new Uint8Array(xx);
    let hex = Array.from(view).map(v => pad(v.toString(16), 2));
    return hex.join("");
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


const {
    Universal
} = require('@aeternity/aepp-sdk');



async function get_node(keypair) {
    return await Universal({
        //networkId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: keypair,
    });
}

async function get_balance(pubkey, node) {
    try{
        let balance = await node.balance(pubkey);
        return new BigNumber(balance);
    } catch(err) {
        //console.log(err)
        //throw err;
        return null
    }
}

async function transfer_all(from_ac, to_ac_publicKey, amount) {
    let node = await get_node({publicKey:from_ac.public_key, secretKey: from_ac.private_key});
    await node.spend(amount, to_ac_publicKey);
}


(async function () {
    let accounts=await load();
    let max = Number.parseInt(process.argv[2]);
    let pub = '{"type":"Buffer","data":[9,205,70,242,76,57,243,70,88,65,56,223,54,26,108,60,192,144,202,144,30,122,31,35,211,168,130,103,37,85,66,77]}';
    console.log("Accounts: ", max.toString());
    console.log("Loaded Accounts: ", accounts.length);

    while (accounts.length<max) {
        let ac = await generateSecureWallet("nr_"+accounts.length.toString() ); //, {password:"1234"});
        accounts.push(ac);
        await save(accounts);
    }

    // merge all funds:
    const min_fee = new BigNumber(2*16840000000000);
    let node = await get_node(null);
    for(let user of Users) {
        let balance = await get_balance(user.public_key, node);
        console.log(user.public_key, "->", balance===null?null:balance.toString(10), "(",typeof balance,")");
        if ((user===Users[0]) || (balance==null) || balance.isLessThan(min_fee))
            continue;
        await transfer_all(user, Users[0].public_key, balance.minus(min_fee));
    }
    let full = await get_balance(Users[0].public_key, node);
    console.log( "->", full.toString(10));

    // 167774497400943500440000.018
    // 123456789012345678901234
    let each = full.dividedBy(3*500).minus(min_fee);
    console.log(" -> ", each.toString(10))

    for (let account_idx in accounts) {
        let idx = Number.parseInt(account_idx);
        if (idx<50)
            continue;
        let account = accounts[account_idx];
        let balance;

        await transfer_all(Users[0], account.publicKey, each);
        balance = await get_balance(account.publicKey, node);
        if (balance==null) {
            balance="error"
        } else {
            balance = balance.toString(10);
        }
        console.log(account_idx, " -> ", account.publicKey, balance);
    }


//    let node = await Node();
    // for(let idx=0; idx<max; idx++ ) {
    //    try {
    //        let ac = accounts[idx];
    //
    //    } catch (err) {
    //
    //    }
    // }

    // let account = await jstools.get_account(
    //     jstools.getArgv(2,
    //         jstools.getEnv("CUSTOMER",
    //             jstools.getEnv("ACCOUNT"))
    //         ), "1234");
    //

    //await main();
})();
