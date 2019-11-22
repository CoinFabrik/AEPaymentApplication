const bs58check = require('bs58check');
import * as fs from "fs";
import {getArgv} from "../src/tools";
const {
    Crypto,
} = require('@aeternity/aepp-sdk');

const filename = getArgv(3, "accounts_idx.json");

async function save(an_array) {
    fs.writeFileSync(filename, JSON.stringify(an_array));
}

async function load() {
    let accounts=[];
    try {
        let buf = fs.readFileSync(filename);
        accounts = JSON.parse(buf.toString("ascii"));
    } catch (err) {
    }
    return accounts;
}

async function generateSecureWallet(name) {
  const { secretKey, publicKey } = Crypto.generateKeyPair(true)
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

export async function create_accounts(total, accounts=[]) {
    while (accounts.length<total) {
        let ac = await generateSecureWallet("nr_"+accounts.length.toString() );
        accounts.push(ac);
    }
}

if(module.parent===undefined) {
    (async function () {
        let accounts=await load();
        let max = Number.parseInt(process.argv[2]);
        console.log("Accounts: ", max.toString());
        console.log("Loaded Accounts: ", accounts.length);
        await create_accounts(max, accounts);
        await save(accounts);
        console.log(" + creation done");
    })();
}
