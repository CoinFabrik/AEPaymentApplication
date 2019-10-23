/* tslint:disable:no-console variable-name object-literal-shorthand only-arrow-functions */
/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI
---------------------------------------------------------------------------------- */
import {cc_wallet, cc_wallet_sk, Users} from './aehelpers';
import {recover, sleep} from '../src/tools';
const readline = require('readline');
const {
    Universal,
} = require('@aeternity/aepp-sdk');
const fs = require('fs');

function get_opts(keypair?: object): object {
    const port = 3001;
    let theURL = 'localhost:' + port;
    theURL = process.env.NODE ? process.env.NODE : theURL;
    console.log('Node> ', theURL);

    let temp = '';
    if (-1 === theURL.indexOf('://')) {
        temp = 'http://';
    }
    const API_URL = temp + theURL;
    const INTERNAL_API_URL = API_URL;
    const compilerURL = 'https://compiler.aepps.com';
    return {
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: keypair,
        compilerUrl: compilerURL,
    };
}

async function my_readline(msg) {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(msg, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

function show_balance(address, balance, height) {
    console.log(address, ' balance at ', height, ' is: ', balance);
}

async function transfer(from_ac, to_ac_publicKey, amount) {
    let nodeuser;
    let height;
    const opts = get_opts(from_ac);
    try {
        nodeuser = await Universal(opts);
        height = await nodeuser.height();
    } catch(err) {
        console.log(opts)
        throw err;
    }

    let balance = await nodeuser.balance(from_ac.publicKey);
    show_balance(from_ac.publicKey, balance, height);

    try {
        balance = await nodeuser.balance(to_ac_publicKey);
        show_balance(to_ac_publicKey, balance, height);
    } catch (err) {
        show_balance(to_ac_publicKey, 0, height);
    }

    await my_readline('last chance to cancel. shall we continue?');

    await nodeuser.spend(amount, to_ac_publicKey);
    await sleep(5000);

    height = await nodeuser.height();
    balance = await nodeuser.balance(to_ac_publicKey);
    show_balance(to_ac_publicKey, balance, height);
}

async function get_wallet(spec, pwds=['', '1234']): Promise<cc_wallet_sk> {
    let last_err;
    const spec_idx = spec.split(':');
    const idx = spec_idx[1];
    spec = spec_idx[0];
    console.log(' - opening:', spec, ' idx:', idx);
    const data = fs.readFileSync(spec);
    let obj = JSON.parse(data);

    if (idx !== undefined) {
        obj = obj[idx];
    }
    for (const pwd of pwds) {
        try {
            return {
                publicKey: obj.public_key,
                secretKey: await recover(pwd, obj),
            };
        } catch (err) {
            last_err = err;
        }
    }
    throw last_err;
}

(async function() {
    const _from = process.argv[2];
    let from_ac: cc_wallet_sk;
    let to_ac: string;

    if (process.argv.length < 5) {
        console.error('Missing required arguments: src dst amount');
        process.exit(-1);
    }
    if (_from.startsWith('init')) {
        let idx;
        if (_from === 'init') {
            idx = 0;
        } else {
            idx = Number.parseInt(_from.slice(4), 10);
        }
        from_ac = {publicKey: Users[idx].public_key, secretKey: Users[idx].private_key};
    } else {
        from_ac = await get_wallet(_from);
    }
    console.log('opening src:', from_ac);

    console.log(' - opening dst:', process.argv[3]);
    if (process.argv[3].startsWith('ak_')) {
        to_ac = process.argv[3];
    } else {
        to_ac = (await get_wallet(process.argv[3])).publicKey;
    }

    console.log(' - amount:', process.argv[4]);
    const amount = process.argv[4];
    console.log(' - transfer:');
    await transfer(from_ac, to_ac, amount);
})();
