import * as fs from "fs";
import BigNumber from "bignumber.js";
import {getArgv} from "../src/tools";
import {create_accounts} from "./massive_create";
import {many2one} from "./many2one.";
import {cc_wallet, get_node, lc_wallet, to_cc, Users} from "./aehelpers";
import {node2many, one2many} from "./one2many";

const filename = getArgv(3, "accounts_idx.json");

export async function save(an_array) {
    fs.writeFileSync(filename, JSON.stringify(an_array));
}

export async function load() {
    let accounts=[];
    try {
        let buf = fs.readFileSync(filename);
        accounts = JSON.parse(buf.toString("ascii"));
    } catch (err) {
    }
    return accounts;
}

(async function () {
    let accounts=await load();

    let max = Number.parseInt(process.argv[2]);
    console.log("Accounts: ", max.toString());
    console.log("Loaded Accounts: ", accounts.length);

    await create_accounts(max, accounts);
    await save(accounts);
    console.log(" + creation done");

    // merge all funds:
    const min_fee = new BigNumber(2*16840000000000);
    let node = await get_node(null);
    await  many2one(node, Users.slice(1), Users[0].public_key);

    // distribute
    let full = new BigNumber(await node.balance(Users[0].public_key));
    console.log( "->", full.toString(10));
    let each = full.dividedBy(3*max).minus(min_fee);
    console.log("will transfer each -> ", each.toString(10))

    await one2many(Users[0], accounts.map( (cc: cc_wallet)=> cc.publicKey), each);
})();
